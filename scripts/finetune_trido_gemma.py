#!/usr/bin/env python3
"""
Trido Gemma-2-2B-it / Gemma-4 QLoRA Fine-Tuner.
Optimized for NVIDIA RTX 5050 Laptop GPU (16 GB System RAM, 4-6 GB VRAM).
Exports directly to 16-bit or GGUF format for Ollama integration.

Usage:
  pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
  pip install --no-deps trl peft accelerate bitsandbytes
  python scripts/finetune_trido_gemma.py
"""

import os
import torch

def train():
    try:
        from unsloth import FastLanguageModel
        from trl import SFTTrainer
        from transformers import TrainingArguments
        from datasets import load_dataset
    except ImportError:
        print("""
[ERROR] Missing required libraries. Please install:
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
pip install --no-deps trl peft accelerate bitsandbytes datasets
""")
        return

    max_seq_length = 2048
    dtype = None # Auto detect: Float16 for Turing/Ampere/Blackwell
    load_in_4bit = True # 4-bit QLoRA to fit RTX 5050 Laptop GPU (~2.5 GB VRAM)

    print("Loading base model: google/gemma-2-2b-it with 4-bit quantization...")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name="google/gemma-2-2b-it",
        max_seq_length=max_seq_length,
        dtype=dtype,
        load_in_4bit=load_in_4bit,
    )

    model = FastLanguageModel.get_peft_model(
        model,
        r=16,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj", "gate_proj", "up_proj", "down_proj"],
        lora_alpha=16,
        lora_dropout=0,
        bias="none",
        use_gradient_checkpointing="unsloth",
        random_state=3407,
    )

    dataset_path = os.path.join(os.path.dirname(__file__), "trido_sft_dataset.jsonl")
    if not os.path.exists(dataset_path):
        print(f"Generating dataset first via scripts/generate_trido_sft_dataset.py...")
        os.system(f"python {os.path.join(os.path.dirname(__file__), 'generate_trido_sft_dataset.py')}")

    dataset = load_dataset("json", data_files=dataset_path, split="train")

    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        dataset_text_field="messages",
        max_seq_length=max_seq_length,
        dataset_num_proc=2,
        packing=False,
        args=TrainingArguments(
            per_device_train_batch_size=2,
            gradient_accumulation_steps=4,
            warmup_steps=5,
            max_steps=60,
            learning_rate=2e-4,
            fp16=not torch.cuda.is_bf16_supported(),
            bf16=torch.cuda.is_bf16_supported(),
            logging_steps=1,
            optim="adamw_8bit",
            weight_decay=0.01,
            lr_scheduler_type="linear",
            seed=3407,
            output_dir="trido_gemma_output",
        ),
    )

    print("Starting training on RTX 5050...")
    trainer.train()

    output_dir = "trido-gemma-2b-lora"
    print(f"Saving fine-tuned LoRA model to {output_dir}...")
    model.save_pretrained(output_dir)
    tokenizer.save_pretrained(output_dir)

    print("""
===================================================================
TRAINING COMPLETE!
To export to Ollama:
  model.save_pretrained_gguf("trido-gemma-2b-q4", tokenizer, quantization_method="q4_k_m")

Then create a Modelfile:
  FROM ./trido-gemma-2b-q4.gguf
  SYSTEM "You are Trido AI smartboard assistant."

And run:
  ollama create trido-gemma:2b -f Modelfile
===================================================================
""")

if __name__ == "__main__":
    train()
