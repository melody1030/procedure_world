import { useEffect, useRef } from 'react'

const CANVAS_DISPLAY_SIZE = 256

// Always shows the target/noise map (heightfieldRef), which only changes
// when a fresh bake lands — bakeVersion is the redraw trigger. It's
// intentionally NOT re-polled during simulation: the target is frozen
// the moment simulation mode is entered, so there's nothing new to draw
// until the next bake.
export default function NoisePreview2D({ heightfieldRef, gridSize, bakeVersion }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const heights = heightfieldRef.current
    if (!canvas || !heights || heights.length === 0) return
    const ctx = canvas.getContext('2d')

    const off = document.createElement('canvas')
    off.width = gridSize
    off.height = gridSize
    const offCtx = off.getContext('2d')
    const imageData = offCtx.createImageData(gridSize, gridSize)

    for (let j = 0; j < gridSize; j++) {
      for (let i = 0; i < gridSize; i++) {
        const h = heights[j * gridSize + i]
        const v = Math.round(Math.min(1, Math.max(0, h)) * 255)
        const idx = (j * gridSize + i) * 4
        imageData.data[idx] = v
        imageData.data[idx + 1] = v
        imageData.data[idx + 2] = v
        imageData.data[idx + 3] = 255
      }
    }

    offCtx.putImageData(imageData, 0, 0)

    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(off, 0, 0, canvas.width, canvas.height)
  }, [heightfieldRef, bakeVersion, gridSize])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_DISPLAY_SIZE}
      height={CANVAS_DISPLAY_SIZE}
      className="noise-preview"
    />
  )
}
