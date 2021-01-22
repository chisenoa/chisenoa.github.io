import json
import os
import re


LANGUAGE_DIR = "languages"
DEFAULT_LANGUAGE = "en-us"
with open(f"{LANGUAGE_DIR}/{DEFAULT_LANGUAGE}.json", "r") as f:
    default_json = json.load(f)


for file in os.listdir("languages"):
    if file.endswith(".json"):
        filename = file[:-5]
        if filename == DEFAULT_LANGUAGE:
            continue  # Don't check this file, this is for reference

        with open(f"{LANGUAGE_DIR}/{file}", encoding="utf-8") as f:
            lang = json.load(f)

        for key in [g for g in default_json]:
            if key not in [g for g in lang]:
                raise KeyError(f"Missing JSON key in {file}: {key}")

        words_failed = []
        for word in lang["words"]:
            if re.compile("(.* .*)").search(word):
                words_failed.append(word)

        if words_failed:
            all_words_failed = ", ".join(words_failed)
            raise KeyError(f"You can't have 2 words inside a string ({file}) | {all_words_failed}")

print("All checks passed :)")
