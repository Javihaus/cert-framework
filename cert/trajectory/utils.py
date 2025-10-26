"""
Utility functions for trajectory monitoring.

Memory-efficient model loading and cleanup utilities.
"""

import torch
import gc
from typing import Tuple


def load_model_for_monitoring(
    model_name: str,
    use_8bit: bool = True,
    device: str = "cuda"
) -> Tuple:
    """
    Load model efficiently for trajectory monitoring.

    Args:
        model_name: HuggingFace model identifier
        use_8bit: Use 8-bit quantization for memory efficiency
        device: 'cuda' or 'cpu'

    Returns:
        (model, tokenizer) tuple
    """
    from transformers import AutoModelForCausalLM, AutoTokenizer

    print(f"Loading {model_name}...")

    tokenizer = AutoTokenizer.from_pretrained(
        model_name,
        trust_remote_code=True
    )

    if use_8bit and device == "cuda":
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            device_map="auto",
            load_in_8bit=True,
            torch_dtype=torch.float16,
            trust_remote_code=True
        )
    else:
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            device_map="auto" if device == "cuda" else None,
            torch_dtype=torch.float16 if device == "cuda" else torch.float32,
            trust_remote_code=True
        )

    # Set padding token
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    print(f"✓ Model loaded successfully")
    return model, tokenizer


def unload_model(model, tokenizer):
    """Clean up model from memory."""
    del model
    del tokenizer
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
    gc.collect()
    print("✓ Model unloaded")
