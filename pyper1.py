import os

# Ask for folder to scan
BASE_DIR = input("Enter the path of the folder to scan: ").strip()

# Validate the directory
if not os.path.isdir(BASE_DIR):
    print("❌ Invalid directory. Please try again.")
    exit(1)

all_code = ""

# Walk through directory, skipping 'venv' and 'node_modules'
for root, dirs, files in os.walk(BASE_DIR):
    # Safely remove unwanted folders from traversal
    for skip_dir in ["venv", "node_modules"]:
        if skip_dir in dirs:
            dirs.remove(skip_dir)

    for file in files:
        if file.endswith((".py", ".tsx", ".ts", ".css")):
            file_path = os.path.join(root, file)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    code = f.read()
                    rel_path = os.path.relpath(file_path, BASE_DIR)
                    all_code += f"\n\n# === {rel_path} ===\n{code}"
            except Exception as e:
                print(f"⚠️ Failed to read {file_path}: {e}")

# Output file path
output_path = os.path.join(os.path.dirname(__file__), "all_code.txt")

# Write the collected code
with open(output_path, "w", encoding="utf-8") as out_file:
    out_file.write(all_code)

print(f"✅ All code saved to: {output_path}")
