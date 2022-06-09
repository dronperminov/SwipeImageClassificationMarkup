const LEFT = "LEFT"
const RIGHT = "RIGHT"
const UP = "UP"
const DOWN = "DOWN"

const THRESHOLD = 0.4
const PIXELS_THRESHOLD = 100
const MIN_PIXELS_SHIFT = 5

const USE_IMAGE_AS_BACKGROUND = false
const STICK_IMAGE_TO_TOP = false

const NAMES = {
    LEFT: 'влево',
    RIGHT: 'вправо',
    UP: 'вверх',
    DOWN: 'вниз',
}

function SwipeMarkup(title, items, imgURL, labels, divId, isFullScreen, onClassify) {
    this.labels = labels
    this.title = title
    this.isFullScreen = isFullScreen
    this.onClassify = onClassify

    this.image = new Image()
    this.image.src = imgURL
    this.image.onload = () => this.Init(divId, items)
}

SwipeMarkup.prototype.Init = function(id, items) {
    this.InitBlocks(id, items)
    this.InitialDraw()

    window.addEventListener('resize', () => this.InitialDraw())

    this.canvasBox.addEventListener('mousedown', (e) => this.MouseDown(e.offsetX, e.offsetY))
    this.canvasBox.addEventListener('mouseup', (e) => this.MouseUp())
    this.canvasBox.addEventListener('mousemove', (e) => this.MouseMove(e.offsetX, e.offsetY))
    this.canvasBox.addEventListener('mouseleave', (e) => this.MouseLeave())

    this.canvasBox.addEventListener('touchstart', (e) => this.TouchStart(e))
    this.canvasBox.addEventListener('touchmove', (e) => this.TouchMove(e))
    this.canvasBox.addEventListener('touchend', (e) => this.TouchEnd(e))

    document.addEventListener('keydown', (e) => this.KeyDown(e))
}

SwipeMarkup.prototype.InitialDraw = function() {
    this.InitSizes()
    this.Draw()
}

SwipeMarkup.prototype.InitBlocks = function(id, items) {
    this.mainBox = document.getElementById(id)

    this.InitMenuBlock(items)
    this.InitCanvasBlock()
    this.InitLabelsBlock()

    this.isPressed = false
    this.isSwiping = false
}

SwipeMarkup.prototype.InitMenuBlock = function(items) {
    this.menuBlock = document.createElement('div')
    this.menuBlock.className = 'menu-box'

    let titleBox = document.createElement('div')
    titleBox.className = 'title-box'
    titleBox.innerHTML = this.title

    let menuIcon = document.createElement('div')
    menuIcon.className = 'menu-icon'
    menuIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path d="M 2 5 L 2 7 L 22 7 L 22 5 L 2 5 z M 2 11 L 2 13 L 22 13 L 22 11 L 2 11 z M 2 17 L 2 19 L 22 19 L 22 17 L 2 17 z"></path></svg>'
    menuIcon.addEventListener('click', () => this.ToggleMenu())

    this.menuBlock.appendChild(titleBox)
    this.menuBlock.appendChild(menuIcon)
    this.InitMenu(items)

    this.mainBox.appendChild(this.menuBlock)
}

SwipeMarkup.prototype.InitMenu = function(items) {
    this.menu = document.createElement('span')
    this.menu.className = 'menu'
    this.menu.innerHTML = items.join('<hr>')
    this.menu.style.display = 'none'
    this.menuBlock.appendChild(this.menu)
}

SwipeMarkup.prototype.ToggleMenu = function() {
    this.menu.style.display = this.menu.style.display == 'none' ? '' : 'none'
}

SwipeMarkup.prototype.CloseMenu = function() {
    this.menu.style.display = 'none'
}

SwipeMarkup.prototype.InitCanvasBlock = function() {
    this.canvasBox = document.createElement('div')
    this.canvasBox.className = 'canvas-box'

    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')
    this.canvasBox.appendChild(this.canvas)

    this.mainBox.appendChild(this.canvasBox)
}

SwipeMarkup.prototype.MakeIcon = function(color) {
    let icon = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    icon.setAttribute('width', '32')
    icon.setAttribute('height', '32')
    icon.setAttribute('viewBox', '0 0 24 24')

    let path = document.createElementNS("http://www.w3.org/2000/svg", "polyline")
    path.setAttribute('points', "4 13 9 18 20 7")
    path.setAttribute('stroke', color)
    path.setAttribute('fill', 'none')
    path.setAttribute('stroke-width', '2')

    icon.appendChild(path)
    return icon
}

SwipeMarkup.prototype.InitLabel = function(dir) {
    let label = this.labels[dir]

    let cell = document.createElement('div')
    cell.className = 'labels-cell'

    let labelBtn = document.createElement('div')
    labelBtn.className = 'label-btn'
    labelBtn.addEventListener('click', () => this.Swipe(dir))

    labelBtn.appendChild(this.MakeIcon(label['background']))

    let labelText = document.createElement('div')
    labelText.innerHTML = label['name'] + '<br>(' + NAMES[dir] + ')'

    cell.appendChild(labelBtn)
    cell.appendChild(labelText)
    cell.style.width = `${100 / Object.keys(this.labels).length}%`

    this.labelsBox.appendChild(cell)
}

SwipeMarkup.prototype.InitLabelsBlock = function() {
    this.labelsBox = document.createElement('div')
    this.labelsBox.className = 'labels-box'

    for (let dir of Object.keys(this.labels))
        this.InitLabel(dir)

    this.mainBox.appendChild(this.labelsBox)
}

SwipeMarkup.prototype.InitSizes = function() {
    let padding = this.menuBlock.offsetHeight + this.labelsBox.offsetHeight + 5
    this.width = (this.isFullScreen ? window.innerWidth : this.mainBox.clientWidth)
    this.height = (this.isFullScreen ? window.innerHeight : this.mainBox.clientHeight) - padding

    let scaleWidth = this.width / this.image.width
    let scaleHeight = this.height / this.image.height
    this.scale = Math.min(scaleWidth, scaleHeight)

    this.imageWidth = this.image.width * this.scale
    this.imageHeight = this.image.height * this.scale

    if (STICK_IMAGE_TO_TOP) {
        this.height = Math.min(this.height, this.imageHeight)
    }

    this.imageX = (this.width - this.imageWidth) / 2
    this.imageY = (this.height - this.imageHeight) / 2

    this.canvas.width = this.width
    this.canvas.height = this.height
}

SwipeMarkup.prototype.GetDirection = function() {
    let dx = this.currX - this.prevX
    let dy = this.currY - this.prevY

    if (Math.abs(dx) < MIN_PIXELS_SHIFT && Math.abs(dy) < MIN_PIXELS_SHIFT)
        return null

    let partX = dx / this.imageWidth
    let partY = dy / this.imageHeight

    let dir = null
    let delta = 0
    let isSwipe = false

    if (Math.abs(partX) > Math.abs(partY)) {
        dir = partX < 0 ? LEFT : RIGHT
        delta = Math.abs(dx) / this.width
        isSwipe = delta > THRESHOLD || Math.abs(dx) > PIXELS_THRESHOLD
    }
    else {
        dir = partY < 0 ? UP : DOWN
        delta = Math.abs(dy) / this.height
        isSwipe = delta > THRESHOLD || Math.abs(dy) > PIXELS_THRESHOLD
    }

    if (Object.keys(this.labels).indexOf(dir) == -1)
        return null

    return { dir: dir, delta: delta, isSwipe: isSwipe }
}

SwipeMarkup.prototype.DrawLabels = function() {
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.font = '20px sans-serif'

    let direction = this.GetDirection()

    if (direction == null)
        return

    let scale = Math.max(0, Math.min(255, Math.floor(direction.delta * 256)))
    let hex = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F']
    let label = this.labels[direction.dir]

    this.ctx.fillStyle = label['background'] + hex[scale >> 4] + hex[scale % 16]
    this.ctx.fillRect(0, 0, this.width, this.height)

    this.ctx.fillStyle = label['color']
    this.ctx.fillText(label['name'], this.width / 2, this.height / 2)

    if (direction.isSwipe) {
        this.ctx.fillText('Отпустите, чтобы смахнуть', this.width / 2, this.height / 2 + 20)
    }
}

SwipeMarkup.prototype.DrawImageAsBackground = function() {
    let scaleWidth = this.width / this.image.width
    let scaleHeight = this.height / this.image.height
    let scale = Math.max(scaleWidth, scaleHeight)
    let x = (this.width - this.image.width * scale) / 2
    let y = (this.height - this.image.height * scale) / 2

    this.ctx.drawImage(this.image, x, y, this.image.width * scale, this.image.height * scale)
}

SwipeMarkup.prototype.Draw = function() {
    this.ctx.clearRect(0, 0, this.width, this.height)

    if (USE_IMAGE_AS_BACKGROUND) {
        this.DrawImageAsBackground()
    }

    let dx = this.isPressed || this.isSwiping ? this.currX - this.prevX : 0
    let dy = this.isPressed || this.isSwiping ? this.currY - this.prevY : 0

    if (this.GetDirection() == null) {
        this.ctx.drawImage(this.image, this.imageX, this.imageY, this.imageWidth, this.imageHeight)
    }
    else if (Math.abs(dx) > Math.abs(dy)) {
        this.ctx.drawImage(this.image, this.imageX + dx, this.imageY, this.imageWidth, this.imageHeight)
    }
    else {
        this.ctx.drawImage(this.image, this.imageX, this.imageY + dy, this.imageWidth, this.imageHeight)
    }

    if (this.isPressed || this.isSwiping) {
        this.DrawLabels()
    }
}

SwipeMarkup.prototype.MouseDown = function(x, y) {
    this.currX = x
    this.currY = y
    this.prevX = x
    this.prevY = y
    this.isPressed = true

    this.CloseMenu()
    this.Draw()
}

SwipeMarkup.prototype.MouseUp = function() {
    let direction = this.GetDirection()

    if (this.isPressed && direction != null && direction.isSwipe) {
        this.isPressed = false
        this.SwipeFrom(direction.dir)
    }
    else {
        this.isPressed = false

        this.Draw()
    }
}

SwipeMarkup.prototype.MouseMove = function(x, y) {
    if (!this.isSwiping) {
        this.currX = x
        this.currY = y
    }

    if (this.isPressed)
        this.Draw()
}

SwipeMarkup.prototype.MouseLeave = function() {
    if (!this.isSwiping)
        this.MouseUp()
}

SwipeMarkup.prototype.TouchStart = function(e) {
    e.preventDefault()

    if (e.targetTouches.length == 1)
        this.MouseDown(e.targetTouches[0].clientX, e.targetTouches[0].clientY)
}

SwipeMarkup.prototype.TouchEnd = function(e) {
    e.preventDefault()
    this.MouseUp()
}

SwipeMarkup.prototype.TouchMove = function(e) {
    e.preventDefault()

    if (e.targetTouches.length == 1)
        this.MouseMove(e.targetTouches[0].clientX, e.targetTouches[0].clientY)
}

SwipeMarkup.prototype.KeyDown = function(e) {
    if (e.key.startsWith('Arrow')) {
        this.Swipe(e.key.substr(5).toUpperCase())
        e.preventDefault()
    }
}

SwipeMarkup.prototype.SwipeFrom = function(dir) {
    this.isPressed = false
    this.CloseMenu()

    let steps = 10
    let step = 1

    let interval = setInterval(() => {
        if (dir == LEFT) {
            this.currX -= this.width / 4 / steps * step
        }
        else if (dir == RIGHT) {
            this.currX += this.width / 4 / steps * step
        }
        else if (dir == UP) {
            this.currY -= this.height / 4 / steps * step
        }
        else if (dir == DOWN) {
            this.currY += this.height / 4 / steps * step
        }

        step += 0.5
        this.isSwiping = true
        this.Draw()

        if (Math.abs(this.currX - this.prevX) > this.width || Math.abs(this.currY - this.prevY) > this.height) {
            clearInterval(interval)
            this.isSwiping = false
            this.Classify(dir)
        }
    }, 30)
}

SwipeMarkup.prototype.Swipe = function(dir) {
    if (Object.keys(this.labels).indexOf(dir) == -1)
        return

    this.currX = this.width / 2
    this.currY = this.height / 2

    this.prevX = this.width / 2
    this.prevY = this.height / 2

    this.SwipeFrom(dir)
}

SwipeMarkup.prototype.Classify = function(dir) {
    this.onClassify(this.labels[dir]["name"])
}
