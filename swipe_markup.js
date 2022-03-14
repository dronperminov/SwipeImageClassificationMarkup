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

SwipeMarkup.prototype.InitLabel = function(index) {
    let label = this.labels[index]

    let cell = document.createElement('div')
    cell.className = 'labels-cell'

    let labelBtn = document.createElement('div')
    labelBtn.className = 'label-btn'
    labelBtn.addEventListener('click', () => this.Swipe(index == 0 ? -1 : 1))

    labelBtn.appendChild(this.MakeIcon(label['background']))

    let labelText = document.createElement('div')
    labelText.innerHTML = label['name']

    cell.appendChild(labelBtn)
    cell.appendChild(labelText)

    this.labelsBox.appendChild(cell)
}

SwipeMarkup.prototype.InitLabelsBlock = function() {
    this.labelsBox = document.createElement('div')
    this.labelsBox.className = 'labels-box'

    this.InitLabel(0)
    this.InitLabel(1)

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

SwipeMarkup.prototype.DrawLabels = function() {
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.font = '20px sans-serif'

    let dx = this.currX - this.prevX

    if (Math.abs(dx) < 2)
        return

    let part = dx / this.imageWidth
    let index = dx < 0 ? 0 : 1

    let scale = Math.max(0, Math.min(255, Math.floor(Math.abs(part * 256))))
    let hex = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F']
    let label = this.labels[index]

    this.ctx.fillStyle = label['background'] + hex[scale >> 4] + hex[scale % 16]
    this.ctx.fillRect(0, 0, this.width, this.height)
    this.ctx.fillStyle = label['color']
    this.ctx.fillText(label['name'], this.width / 2, this.height / 2)
}

SwipeMarkup.prototype.Draw = function() {
    this.ctx.clearRect(0, 0, this.width, this.height)

    let dx = this.isPressed || this.isSwiping ? this.currX - this.prevX : 0
    this.ctx.drawImage(this.image, this.imageX + dx, this.imageY, this.imageWidth, this.imageHeight)

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
    let dx = this.currX - this.prevX

    if (this.isPressed && Math.abs(dx) > this.width / 3) {
        this.isPressed = false
        this.SwipeFrom(Math.sign(dx))
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

SwipeMarkup.prototype.SwipeFrom = function(dir, point) {
    this.isPressed = false

    let steps = 10
    let step = 1

    let interval = setInterval(() => {
        this.currX += dir * this.width / 4 / steps * step
        step += 0.5
        this.isSwiping = true
        this.Draw()

        if (Math.abs(this.currX - this.prevX) > this.width) {
            clearInterval(interval)
            this.isSwiping = false
            this.Classify((dir + 1) >> 1)
        }
    }, 30)
}

SwipeMarkup.prototype.Swipe = function(dir) {
    this.currX = this.width / 2
    this.prevX = this.width / 2

    this.SwipeFrom(dir, this.width / 2)
}

SwipeMarkup.prototype.Classify = function(index) {
    alert(`Классифицировано как ${this.labels[index]["name"]}`)
    document.location.reload()
}