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


@app.get('/')
def index():
    image = markup.get_image()

    if image is None:
        with open("web/no_images.html", encoding="utf-8") as f:
            return HTMLResponse(f.read())

    with open("web/index.html", encoding="utf-8") as f:
        html = f.read()

    return HTMLResponse(html.format(
        labels=json.dumps(markup.config["labels"], ensure_ascii=False, indent=2),
        manifest=markup.config.get("manifest", "#"),
        image=image,
        title=markup.config.get("title", "Swipe markup"),
        image_title=markup.config.get("image_title", markup.get_lost_title()),
    ))


@app.get("/label/{image}/{label}")
def label(image, label):
    markup.label_image(image, label)
    return RedirectResponse(url='/')


@app.get("/restore/{image}")
def restore(image):
    markup.restore_image(image)
    return RedirectResponse(url='/history')


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
                f'<td><a href="/restore/{image}">восстановить</a></td>'
            ]
            rows.append(f'<tr>{"".join(cells)}</tr>')
    else:
        rows.append('<tr><td colspan="4">ещё ничего не размечено</td></tr>')

    return HTMLResponse(html.format(rows="\n".join(rows)))


@app.get("/download")
def download():
    return FileResponse("labeled.json", media_type="application/octet-stream", filename="labeled.json")
