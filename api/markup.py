import json
import os
import random
from typing import List, Tuple


class Markup:
    RANDOM_MODE = 'random'
    SEQUENTIAL_MODE = 'sequential'

    def __init__(self, config_path: str):
        with open(config_path, encoding="utf-8") as f:
            self.config = json.load(f)

        self.images_path = self.config.get("images_path", "images")
        self.select_mode = self._get_select_mode()

        if os.path.exists("labeled.json"):
            with open("labeled.json", "r", encoding="utf-8") as f:
                self.labeled = json.load(f)
        else:
            self.labeled = {}

        self._save_labeled()
        self.images = os.listdir(self.images_path)

    def _get_select_mode(self):
        mode = self.config.get("select_mode", Markup.RANDOM_MODE)

        if mode != Markup.RANDOM_MODE and mode != Markup.SEQUENTIAL_MODE:
            raise ValueError(f"Invalid select_mode \"{mode}\"")

        return mode

    def _save_labeled(self):
        with open("labeled.json", "w", encoding="utf-8") as f:
            json.dump(self.labeled, f, indent=4, ensure_ascii=False)

    def get_image(self):
        available_images = [image for image in self.images if image not in self.labeled]

        if not available_images:
            return None

        if self.select_mode == Markup.RANDOM_MODE:
            return random.choice(available_images)

        return available_images[0]

    def get_labeled(self) -> List[Tuple[str, str]]:
        return [(image, label) for image, label in self.labeled.items()]

    def label_image(self, image: str, label: str):
        self.labeled[image] = label
        self._save_labeled()

    def restore_image(self, image: str):
        del self.labeled[image]
        self._save_labeled()

    def get_lost_title(self) -> str:
        return f'Осталось {len(self.images) - len(self.labeled)} / {len(self.images)}'
