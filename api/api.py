import json

from fastapi import FastAPI
from fastapi.responses import HTMLResponse, RedirectResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from api.markup import Markup


markup = Markup("config.json")

app = FastAPI()
app.mount("/images", StaticFiles(directory=markup.images_path), name="images")
app.mount("/css", StaticFiles(directory="web/css"), name="css")
app.mount("/js", StaticFiles(directory="web/js"), name="js")


def markup_image(image: str):
    with open("web/index.html", encoding="utf-8") as f:
        html = f.read()

    items = []

    if "manifest" in markup.config:
        items.append(f'<a href="{markup.config["manifest"]}"><i class="fa fa-question"></i> Манифест</a>')

    if markup.have_labeled():
        items.append(f'<a href="/restore-last"><i class="fa fa-list"></i> Восстановить прошлую</a>')

    items.append('<a href="/history"><i class="fa fa-list"></i> История</a>')
    items.append('<a href="/download"><i class="fa fa-download"></i> Скачать разметку</a>')

    return HTMLResponse(html.format(
        labels=json.dumps(markup.config["labels"], ensure_ascii=False, indent=2),
        items=items,
        image=image,
        title=markup.config.get("title", "Swipe markup"),
        image_title=markup.config.get("image_title", markup.get_lost_title()),
    ))


@app.get('/')
def index():
    image = markup.get_image()

    if image is None:
        with open("web/no_images.html", encoding="utf-8") as f:
            return HTMLResponse(f.read())

    return markup_image(image)


@app.get("/label/{image}/{label}")
def label(image, label):
    markup.label_image(image, label)
    return RedirectResponse(url='/')


@app.get("/restore/{image}")
def restore(image):
    markup.restore_image(image)
    return RedirectResponse(url='/history')


@app.get("/restore-last")
def restore_last():
    if not markup.have_labeled():
        return RedirectResponse(url="/")

    image = markup.get_last_image()
    markup.restore_image(image)
    return markup_image(image)


@app.get("/remarkup/{image}")
def remarkup(image):
    markup.restore_image(image)
    return markup_image(image)


@app.get("/history")
def history():
    with open("web/history.html", encoding="utf-8") as f:
        html = f.read()

    labeled = markup.get_labeled()
    rows = []

    if labeled:
        for image, label in labeled:
            cells = [
                f'<td><a href="/images/{image}">{image}</a></td>',
                f'<td>{label}</td>',
                f'<td><a href="/restore/{image}">восстановить</a> <a href="/remarkup/{image}">переразметить</a></td>'
            ]
            rows.append(f'<tr>{"".join(cells)}</tr>')
    else:
        rows.append('<tr><td colspan="4">ещё ничего не размечено</td></tr>')

    return HTMLResponse(html.format(rows="\n".join(rows)))


@app.get("/download")
def download():
    return FileResponse("labeled.json", media_type="application/octet-stream", filename="labeled.json")
