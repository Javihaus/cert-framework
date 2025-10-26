"""
Retry decorators with exponential backoff.

Provides:
- @retry decorator with configurable backoff
- Exponential backoff with jitter
- Max retries configuration
- Retry on specific exception types
"""

import logging
import random
import time
from functools import wraps
from typing import Callable, Optional, Tuple, Type

from cert.core.errors import MaxRetriesExceeded

logger = logging.getLogger(__name__)


def retry(
    max_retries: int = 3,
    backoff_base: float = 2.0,
    max_backoff: float = 60.0,
    exceptions: Tuple[Type[Exception], ...] = (Exception,),
    on_retry: Optional[Callable] = None,
):
    """
    Retry decorator with exponential backoff.

    Args:
        max_retries: Maximum retry attempts
        backoff_base: Base for exponential backoff (base^attempt)
        max_backoff: Maximum backoff time in seconds
        exceptions: Tuple of exception types to retry on
        on_retry: Callback called on each retry (for logging/metrics)

    Example:
        @retry(max_retries=3, exceptions=(TimeoutError, ConnectionError))
        def unreliable_operation():
            # May fail with timeout or connection error
            return fetch_data()
    """

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    # Don't retry on last attempt
                    if attempt == max_retries:
                        raise

                    # Calculate backoff with jitter
                    backoff = min(
                        backoff_base**attempt + random.uniform(0, 1), max_backoff
                    )

                    # Call retry callback if provided
                    if on_retry:
                        try:
                            on_retry(attempt, backoff, e)
                        except Exception as callback_error:
                            logger.warning(f"Retry callback failed: {callback_error}")

                    logger.warning(
                        f"Retry {attempt + 1}/{max_retries} after {backoff:.2f}s",
                        extra={
                            "function": func.__name__,
                            "attempt": attempt + 1,
                            "max_retries": max_retries,
                            "backoff_s": backoff,
                            "error": str(e),
                            "error_type": type(e).__name__,
                        },
                    )

                    time.sleep(backoff)

            # This should never be reached, but just in case
            raise MaxRetriesExceeded(max_retries)

        return wrapper

    return decorator


def async_retry(
    max_retries: int = 3,
    backoff_base: float = 2.0,
    max_backoff: float = 60.0,
    exceptions: Tuple[Type[Exception], ...] = (Exception,),
    on_retry: Optional[Callable] = None,
):
    """
    Async retry decorator with exponential backoff.

    Args:
        max_retries: Maximum retry attempts
        backoff_base: Base for exponential backoff (base^attempt)
        max_backoff: Maximum backoff time in seconds
        exceptions: Tuple of exception types to retry on
        on_retry: Callback called on each retry (for logging/metrics)

    Example:
        @async_retry(max_retries=3, exceptions=(TimeoutError,))
        async def unreliable_async_operation():
            # May fail with timeout
            return await fetch_data_async()
    """

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            import asyncio

            for attempt in range(max_retries + 1):
                try:
                    return await func(*args, **kwargs)
                except exceptions as e:
                    # Don't retry on last attempt
                    if attempt == max_retries:
                        raise

                    # Calculate backoff with jitter
                    backoff = min(
                        backoff_base**attempt + random.uniform(0, 1), max_backoff
                    )

                    # Call retry callback if provided
                    if on_retry:
                        try:
                            if asyncio.iscoroutinefunction(on_retry):
                                await on_retry(attempt, backoff, e)
                            else:
                                on_retry(attempt, backoff, e)
                        except Exception as callback_error:
                            logger.warning(f"Retry callback failed: {callback_error}")

                    logger.warning(
                        f"Async retry {attempt + 1}/{max_retries} after {backoff:.2f}s",
                        extra={
                            "function": func.__name__,
                            "attempt": attempt + 1,
                            "max_retries": max_retries,
                            "backoff_s": backoff,
                            "error": str(e),
                            "error_type": type(e).__name__,
                        },
                    )

                    await asyncio.sleep(backoff)

            # This should never be reached, but just in case
            raise MaxRetriesExceeded(max_retries)

        return wrapper

    return decorator
