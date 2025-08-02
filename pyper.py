import os

# Ask for folder to scan
BASE_DIR = input("Enter the path of the folder to scan: ").strip()

# Validate the directory
if not os.path.isdir(BASE_DIR):
    print("❌ Invalid directory. Please try again.")
    exit(1)

all_code = ""

# Walk through directory, skipping 'venv'
for root, dirs, files in os.walk(BASE_DIR):
    # Skip 'venv' directory
    if "node_modules" in dirs:
        dirs.remove("node_modules")

    for file in files:
        if file.endswith((".py", ".tsx", ".ts",".css")):
            file_path = os.path.join(root, file)
            with open(file_path, "r", encoding="utf-8") as f:
                code = f.read()
                rel_path = os.path.relpath(file_path, BASE_DIR)
                all_code += f"\n\n# === {rel_path} ===\n{code}"

# Output file path
output_path = os.path.join(os.path.dirname(__file__), "all_code1.txt")

# Write the collected code
with open(output_path, "w", encoding="utf-8") as out_file:
    out_file.write(all_code)

print(f"✅ All Python code (excluding venv) saved to: {output_path}")
