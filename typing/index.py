import json
import os
import asyncio

from flaskext.markdown import Markdown
from quart import Quart, render_template, send_from_directory, abort, request

with open("config.json", "r") as f:
    config = json.load(f)

app = Quart(__name__)
Markdown(app)
app.config.update(
    DEBUG=config["debug"],
    PROPAGATE_EXCEPTIONS=False
)


# Fetch all languages to cache
all_languages = {}
words_language = {}
for file in os.listdir("languages"):
    if file.endswith(".json"):
        with open(f"languages/{file}", encoding="utf-8") as f:
            lang_temp = json.load(f)
            lang_name = file[:-5]

            all_languages[lang_name] = {
                word: lang_temp[word] for word in lang_temp if word != "words"
            }

            words_language[lang_name] = lang_temp["words"]


# Fetch README.md to cache
with open("README.md", "r", encoding="utf-8") as f:
    readme_text = "\n".join(f.readlines()[1:])


def get_theme():
    theme = request.cookies.get("theme")
    if not theme or theme == "dark":
        return "dark-theme"
    elif theme == "light":
        return "light-theme"


@app.route("/")
async def index_home():
    return await render_template(
        "index.html", words=words_language["en-us"], language=all_languages["en-us"], theme=get_theme()
    )


@app.route("/languages")
async def index_select_language():
    return await render_template(
        "languages.html", languages=[all_languages[g] for g in all_languages], theme=get_theme()
    )


@app.route("/languages/<language>")
async def index_home_lang(language: str):
    if language not in [g for g in all_languages]:
        abort(404, "Language not found...")

    return await render_template(
        "index.html", words=words_language[language], language=all_languages[language], theme=get_theme()
    )


@app.route("/about")
async def index_about():
    return await render_template(
        "about.html", readme=readme_text, theme=get_theme()
    )


@app.route("/assets/<path:path>")
async def send_assets(path):
    return await send_from_directory("templates/assets", path)


@app.errorhandler(404)
async def page_not_found(e):
    return await render_template("error.html", error=e.description, error_code="404", theme=get_theme()), 404


loop = asyncio.get_event_loop()
app.run(port=config["port"], loop=loop)
