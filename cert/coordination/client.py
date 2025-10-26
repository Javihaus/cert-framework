"""
Anthropic API client with resilience patterns.

Provides:
- Rate limiting (50 req/min default)
- Circuit breaker
- Retry with exponential backoff
- Cost tracking
"""

import asyncio
import logging
import time
from typing import Optional

from cert.core.circuit_breaker import CircuitBreaker
from cert.core.retry import async_retry
from cert.core.errors import CircuitBreakerOpen
from cert.observability.metrics import MetricsCollector

logger = logging.getLogger(__name__)

# Try to import anthropic
try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
except ImportError:
    logger.warning("anthropic package not available. Install with: pip install anthropic")
    ANTHROPIC_AVAILABLE = False


class RateLimiter:
    """Token bucket rate limiter."""

    def __init__(self, requests_per_minute: int):
        """
        Initialize rate limiter.

        Args:
            requests_per_minute: Maximum requests per minute
        """
        self._rate = requests_per_minute / 60.0  # req/s
        self._tokens = float(requests_per_minute)
        self._max_tokens = float(requests_per_minute)
        self._last_update = time.time()
        self._lock = asyncio.Lock()

    async def acquire(self):
        """Acquire token (blocks if rate exceeded)."""
        async with self._lock:
            now = time.time()
            elapsed = now - self._last_update

            # Refill tokens
            self._tokens = min(
                self._max_tokens,
                self._tokens + elapsed * self._rate
            )
            self._last_update = now

            # Wait if no tokens available
            if self._tokens < 1.0:
                wait_time = (1.0 - self._tokens) / self._rate
                logger.debug(f"Rate limit reached, waiting {wait_time:.2f}s")
                await asyncio.sleep(wait_time)
                self._tokens = 0
            else:
                self._tokens -= 1.0


class CostTracker:
    """Track API costs."""

    # Claude pricing (as of 2024)
    PRICING = {
        "claude-3-5-sonnet-20241022": {
            "input": 0.003 / 1000,   # $3 per 1M tokens
            "output": 0.015 / 1000,  # $15 per 1M tokens
        },
        "claude-3-sonnet-20240229": {
            "input": 0.003 / 1000,
            "output": 0.015 / 1000,
        },
        "claude-3-haiku-20240307": {
            "input": 0.00025 / 1000,  # $0.25 per 1M tokens
            "output": 0.00125 / 1000,  # $1.25 per 1M tokens
        },
    }

    def calculate_cost(
        self,
        model: str,
        input_tokens: int,
        output_tokens: int,
    ) -> float:
        """
        Calculate cost in USD.

        Args:
            model: Model name
            input_tokens: Input token count
            output_tokens: Output token count

        Returns:
            Cost in USD
        """
        pricing = self.PRICING.get(model, {"input": 0, "output": 0})
        cost = (
            input_tokens * pricing["input"] +
            output_tokens * pricing["output"]
        )
        return cost


class AnthropicClientWithResilience:
    """Production-grade Anthropic API client with resilience patterns."""

    def __init__(
        self,
        api_key: str,
        requests_per_minute: int = 50,
        circuit_breaker: Optional[CircuitBreaker] = None,
        metrics: Optional[MetricsCollector] = None,
        max_cost_per_hour: float = 10.0,
    ):
        """
        Initialize Anthropic client.

        Args:
            api_key: Anthropic API key
            requests_per_minute: Rate limit (default: 50)
            circuit_breaker: Optional circuit breaker instance
            metrics: Optional metrics collector
            max_cost_per_hour: Maximum cost per hour (USD)
        """
        if not ANTHROPIC_AVAILABLE:
            raise ImportError(
                "anthropic package required for coordination monitoring. "
                "Install with: pip install anthropic"
            )

        self._client = anthropic.Anthropic(api_key=api_key)
        self._circuit = circuit_breaker or CircuitBreaker(
            failure_threshold=5,
            recovery_timeout=30.0,
            name="anthropic_api"
        )
        self._rate_limiter = RateLimiter(requests_per_minute=requests_per_minute)
        self._metrics = metrics or MetricsCollector()
        self._cost_tracker = CostTracker()
        self._max_cost_per_hour = max_cost_per_hour
        self._hourly_cost = 0.0
        self._hour_start = time.time()

    def _check_cost_limit(self) -> bool:
        """
        Check if hourly cost limit exceeded.

        Returns:
            True if limit exceeded
        """
        # Reset if new hour
        if time.time() - self._hour_start > 3600:
            self._hourly_cost = 0.0
            self._hour_start = time.time()

        return self._hourly_cost >= self._max_cost_per_hour

    @async_retry(
        max_retries=3,
        backoff_base=2.0,
        exceptions=(Exception,),  # Will be refined inside the method
    )
    async def complete(
        self,
        prompt: str,
        model: str = "claude-3-5-sonnet-20241022",
        max_tokens: int = 1024,
        temperature: float = 1.0,
        timeout: float = 30.0,
        agent_id: Optional[str] = None,
        **kwargs,
    ) -> str:
        """
        Complete prompt with resilience patterns.

        Args:
            prompt: Input prompt
            model: Claude model name
            max_tokens: Maximum response tokens
            temperature: Sampling temperature
            timeout: Request timeout
            agent_id: Agent identifier (for metrics)
            **kwargs: Additional arguments for API

        Returns:
            Response text

        Raises:
            CircuitBreakerOpen: Circuit breaker is open
            Exception: API errors
        """
        # Check circuit breaker
        if self._circuit.is_open():
            self._metrics.coordination_api_calls.labels(
                agent=agent_id or "unknown",
                status="circuit_breaker_open"
            ).inc()
            raise CircuitBreakerOpen(service="anthropic_api")

        # Check cost limit
        if self._check_cost_limit():
            logger.warning(f"Hourly cost limit (${self._max_cost_per_hour}) exceeded")
            raise Exception(f"Hourly cost limit exceeded: ${self._max_cost_per_hour}")

        # Rate limit
        await self._rate_limiter.acquire()

        start = time.time()

        try:
            # Make API call
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    self._client.messages.create,
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=max_tokens,
                    temperature=temperature,
                    **kwargs
                ),
                timeout=timeout
            )

            # Extract response text
            response_text = response.content[0].text

            # Record success
            self._circuit.record_success()
            self._metrics.coordination_api_calls.labels(
                agent=agent_id or "unknown",
                status="success"
            ).inc()

            # Track cost
            cost = self._cost_tracker.calculate_cost(
                model=model,
                input_tokens=response.usage.input_tokens,
                output_tokens=response.usage.output_tokens,
            )
            self._hourly_cost += cost
            self._metrics.coordination_cost.labels(
                agent=agent_id or "unknown"
            ).inc(cost)

            # Log
            logger.info(
                "Claude API call successful",
                extra={
                    "agent": agent_id,
                    "model": model,
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens,
                    "cost_usd": cost,
                    "duration_s": time.time() - start,
                }
            )

            return response_text

        except asyncio.TimeoutError as e:
            self._circuit.record_failure()
            self._metrics.coordination_api_calls.labels(
                agent=agent_id or "unknown",
                status="timeout"
            ).inc()
            logger.warning(f"Claude API timeout after {timeout}s")
            raise

        except Exception as e:
            self._circuit.record_failure()
            error_type = type(e).__name__

            self._metrics.coordination_api_calls.labels(
                agent=agent_id or "unknown",
                status="error"
            ).inc()

            logger.error(
                f"Claude API error: {e}",
                extra={
                    "agent": agent_id,
                    "error_type": error_type,
                }
            )
            raise

    def get_cost_stats(self) -> dict:
        """Get cost statistics."""
        return {
            "hourly_cost": self._hourly_cost,
            "max_cost_per_hour": self._max_cost_per_hour,
            "utilization": self._hourly_cost / self._max_cost_per_hour,
            "hour_start": self._hour_start,
        }

    def reset_cost(self):
        """Reset cost tracking."""
        self._hourly_cost = 0.0
        self._hour_start = time.time()
        logger.info("Cost tracking reset")
