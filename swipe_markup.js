const LEFT = "LEFT"
const RIGHT = "RIGHT"
const UP = "UP"
const DOWN = "DOWN"

const THRESHOLD = 0.4
const MIN_PIXELS_SHIFT = 5

const NAMES = {
    LEFT: 'влево',
    RIGHT: 'вправо',
    UP: 'вверх',
    DOWN: 'вниз',
}

function SwipeMarkup(imgURL, labels, divId, isFullScreen) {
    this.labels = labels
    this.isFullScreen = isFullScreen

    this.InitBlocks(divId)

    this.image = new Image()
    this.image.src = imgURL
    this.image.onload = () => this.InitialDraw()

    window.addEventListener('resize', () => this.InitialDraw())

    this.canvasBox.addEventListener('mousedown', (e) => this.MouseDown(e.offsetX, e.offsetY))
    this.canvasBox.addEventListener('mouseup', (e) => this.MouseUp())
    this.canvasBox.addEventListener('mousemove', (e) => this.MouseMove(e.offsetX, e.offsetY))
    this.canvasBox.addEventListener('mouseleave', (e) => this.MouseLeave())

    this.canvasBox.addEventListener('touchstart', (e) => this.TouchStart(e))
    this.canvasBox.addEventListener('touchmove', (e) => this.TouchMove(e))
    this.canvasBox.addEventListener('touchend', (e) => this.TouchEnd(e))
}

SwipeMarkup.prototype.InitialDraw = function() {
    this.InitSizes()
    this.Draw()
}

SwipeMarkup.prototype.InitBlocks = function(id) {
    this.mainBox = document.getElementById(id)

    this.InitCanvasBlock()
    this.InitLabelsBlock()

    this.isPressed = false
    this.isSwiping = false
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
    this.width = (this.isFullScreen ? window.innerWidth : this.mainBox.clientWidth)
    this.height = (this.isFullScreen ? window.innerHeight : this.mainBox.clientHeight) - this.labelsBox.offsetHeight - 5

    let scaleWidth = this.width / this.image.width
    let scaleHeight = this.height / this.image.height
    this.scale = Math.min(scaleWidth, scaleHeight)

    this.imageWidth = this.image.width * this.scale
    this.imageHeight = this.image.height * this.scale

    this.height = Math.min(this.height, this.imageHeight)

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
        isSwipe = delta > THRESHOLD
    }
    else {
        dir = partY < 0 ? UP : DOWN
        delta = Math.abs(dy) / this.height
        isSwipe = delta > THRESHOLD
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

SwipeMarkup.prototype.Draw = function() {
    this.ctx.clearRect(0, 0, this.width, this.height)

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

SwipeMarkup.prototype.SwipeFrom = function(dir) {
    this.isPressed = false

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
    this.currX = this.width / 2
    this.currY = this.height / 2

    this.prevX = this.width / 2
    this.prevY = this.height / 2

    this.SwipeFrom(dir)
}

SwipeMarkup.prototype.Classify = function(dir) {
    alert(`Классифицировано как ${this.labels[dir]["name"]}`)
    document.location.reload()
}