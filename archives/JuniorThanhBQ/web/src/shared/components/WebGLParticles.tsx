import { useEffect, useRef } from 'react'

export function WebGLParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl')
    if (!gl) return

    const vertexShaderSource = `
      attribute vec2 position;
      attribute float size;
      attribute float alpha;
      varying float vAlpha;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
        gl_PointSize = size;
        vAlpha = alpha;
      }
    `

    const fragmentShaderSource = `
      precision mediump float;
      varying float vAlpha;
      uniform vec3 u_color;
      void main() {
        vec2 coord = gl_PointCoord - vec2(0.5);
        float dist = length(coord);
        if (dist > 0.5) {
          discard;
        }
        gl_FragColor = vec4(u_color, vAlpha);
      }
    `

    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type)
      if (!shader) return null
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader)
        return null
      }
      return shader
    }

    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
    if (!vertexShader || !fragmentShader) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program)
      return
    }

    const positionAttr = gl.getAttribLocation(program, 'position')
    const sizeAttr = gl.getAttribLocation(program, 'size')
    const alphaAttr = gl.getAttribLocation(program, 'alpha')
    const colorUniform = gl.getUniformLocation(program, 'u_color')

    const particlesCount = 80
    const particles = Array.from({ length: particlesCount }, () => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      vx: (Math.random() - 0.5) * 0.0015,
      vy: (Math.random() - 0.5) * 0.0015 - 0.0005,
      baseSize: Math.random() * 12 + 6,
      size: 0,
      alpha: Math.random() * 0.12 + 0.04,
    }))

    const bufferData = new Float32Array(particlesCount * 4)
    const buffer = gl.createBuffer()

    let animationFrameId = 0
    let lastScrollY = window.scrollY
    let scrollSpeed = 0
    const mouse = { x: 999, y: 999 }

    const handleResize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)

      canvas.width = Math.floor(rect.width * dpr)
      canvas.height = Math.floor(rect.height * dpr)

      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    const handleScroll = () => {
      const currentScroll = window.scrollY
      scrollSpeed = (currentScroll - lastScrollY) * 0.001
      lastScrollY = currentScroll
    }

    window.addEventListener('scroll', handleScroll)

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
    }

    window.addEventListener('mousemove', handleMouseMove)

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const render = () => {
      scrollSpeed *= 0.95

      const isDark = document.documentElement.classList.contains('dark')
      const targetColor = isDark ? [0.23, 0.51, 0.96] : [0.16, 0.22, 0.38]

      for (let i = 0; i < particlesCount; i++) {
        const p = particles[i]

        p.y += p.vy - scrollSpeed * 0.5
        p.x += p.vx

        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 0.3) {
          const force = (0.3 - dist) * 0.01
          p.x -= (dx / dist) * force
          p.y -= (dy / dist) * force
        }

        if (p.y < -1.1) p.y = 1.1
        else if (p.y > 1.1) p.y = -1.1
        if (p.x < -1.1) p.x = 1.1
        else if (p.x > 1.1) p.x = -1.1

        p.size = p.baseSize

        const idx = i * 4
        bufferData[idx] = p.x
        bufferData[idx + 1] = p.y
        bufferData[idx + 2] = p.size
        bufferData[idx + 3] = isDark ? p.alpha : 0.4
      }

      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.useProgram(program)

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
      gl.bufferData(gl.ARRAY_BUFFER, bufferData, gl.DYNAMIC_DRAW)

      gl.enableVertexAttribArray(positionAttr)
      gl.vertexAttribPointer(positionAttr, 2, gl.FLOAT, false, 16, 0)

      gl.enableVertexAttribArray(sizeAttr)
      gl.vertexAttribPointer(sizeAttr, 1, gl.FLOAT, false, 16, 8)

      gl.enableVertexAttribArray(alphaAttr)
      gl.vertexAttribPointer(alphaAttr, 1, gl.FLOAT, false, 16, 12)

      gl.uniform3f(colorUniform, targetColor[0], targetColor[1], targetColor[2])

      gl.drawArrays(gl.POINTS, 0, particlesCount)

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('mousemove', handleMouseMove)

      if (gl) {
        gl.deleteBuffer(buffer)
        gl.deleteShader(vertexShader)
        gl.deleteShader(fragmentShader)
        gl.deleteProgram(program)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 blur-[1.5px] dark:blur-0 transition-[filter] duration-500"
    />
  )
}
