import os
import os.path
import random
import json
import hashlib
import uuid

from flask import Flask
from flask import request, redirect, send_from_directory


app = Flask(__name__)


@app.route('/<path:filename>')
def get_file(filename):
    return send_from_directory(".", filename)


@app.route('/', methods=['GET'])
def index():
    with open("swipe_markup_template.html") as f:
        markup = f.read()

    title = "TITLE"
    task_title = "task title"
    labels = '''
        {
            LEFT: { "name": "Class 1", "color": "#fff", "background": "#dd7373" },
            UP: { "name": "Class 2", "color": "#fff", "background": "#4caf50" },
            RIGHT: { "name": "Class 3", "color": "#fff", "background": "#7699d4" },
            DOWN: { "name": "Class 4", "color": "#fff", "background": "#ff9800" },
        }
    '''

    items = '''
        '<a href="#"><i class="fa fa-question"></i> Манифест</a>',
        '<a href="#"><i class="fa fa-rotate-left"></i> Восстановить прошлую</a>',
        '<a href="#"><i class="fa fa-list"></i> История</a>',
        '<a href="#"><i class="fa fa-download"></i> Скачать разметку</a>'
    '''

    img = "imgs/img.jpg"

    return markup.format(
        title=title,
        task_title=task_title,
        labels=labels,
        items=items,
        img=img
    )



if __name__ == '__main__':
    host = "0.0.0.0"
    port = "5000"
    app.run(debug=True, host=host,  port=port)
