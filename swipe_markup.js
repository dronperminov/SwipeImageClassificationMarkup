function SwipeMarkup(imgURL, labels, divId, isFullScreen) {
    this.labels = labels
    this.isFullScreen = isFullScreen

    this.InitBlocks(divId)

    this.image = new Image()
    this.image.src = imgURL
    this.image.onload = () => this.InitialDraw()

    window.addEventListener('resize', () => this.InitialDraw())
    this.canvasBox.addEventListener('mousedown', (e) => this.MouseDown(e.offsetX, e.offsetY))
    this.canvasBox.addEventListener('mouseup', (e) => this.MouseUp(e.offsetX, e.offsetY))
    this.canvasBox.addEventListener('mousemove', (e) => this.MouseMove(e.offsetX, e.offsetY))
}

SwipeMarkup.prototype.InitialDraw = function() {
    this.InitSizes()
    this.Draw()
}

SwipeMarkup.prototype.InitBlocks = function(id) {
    this.mainBox = document.getElementById(id)

    this.InitCanvasBlock()
    this.InitLabelsBlock()
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

SwipeMarkup.prototype.InitLabel = function(label) {
    let cell = document.createElement('div')
    cell.className = 'labels-cell'

    let labelBtn = document.createElement('div')
    labelBtn.className = 'label-btn'

    labelBtn.appendChild(this.MakeIcon(label['color']))

    let labelText = document.createElement('div')
    labelText.innerHTML = label['name']

    cell.appendChild(labelBtn)
    cell.appendChild(labelText)

    this.labelsBox.appendChild(cell)
}

SwipeMarkup.prototype.InitLabelsBlock = function() {
    this.labelsBox = document.createElement('div')
    this.labelsBox.className = 'labels-box'

    for (let label of this.labels)
        this.InitLabel(label)

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

    this.canvas.width = this.width
    this.canvas.height = this.height
}

SwipeMarkup.prototype.DrawImage = function() {
    let x = (this.width - this.imageWidth) / 2
    let y = (this.height - this.imageHeight) / 2

    this.ctx.drawImage(this.image, x, y, this.imageWidth, this.imageHeight)
}

SwipeMarkup.prototype.DrawLabels = function(x, y) {
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.font = '20px sans-serif'

    for (let label of this.labels) {
        let name = label['name']
        let [x1, y1, x2, y2] = label['area']

        x1 = Math.floor(x1 * this.width)
        y1 = Math.floor(y1 * this.height)
        x2 = Math.floor(x2 * this.width)
        y2 = Math.floor(y2 * this.height)

        if (x < x1 || x > x2 || y < y1 || y > y2)
            continue

        let xc = (x1 + x2) / 2
        let yc = (y1 + y2) / 2

        this.ctx.fillStyle = label['background']
        this.ctx.fillRect(x1, y1, x2 - x1, y2 - y1)

        this.ctx.fillStyle = label['color']
        this.ctx.fillText(name, xc, yc)
    }
}

SwipeMarkup.prototype.Draw = function(x = -1, y = -1) {
    this.ctx.clearRect(0, 0, this.width, this.height)

    this.DrawImage()
    this.DrawLabels(x, y)
}

SwipeMarkup.prototype.MouseDown = function(x, y) {

}

SwipeMarkup.prototype.MouseUp = function(x, y) {
    
}

SwipeMarkup.prototype.MouseMove = function(x, y) {
    this.Draw(x, y)
}