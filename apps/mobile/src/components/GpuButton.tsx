import { Pressable, Text, StyleSheet } from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Canvas, useCanvasEffect } from "react-native-wgpu"
import tgpu from "typegpu"
import * as d from "typegpu/data"

type Props = {
  label: string
  onPress?: () => void
  disabled?: boolean
  height?: number
}

// time + resolution uniform'u (TypeGPU tipli struct -> otomatik hizalama/padding)
const Uniforms = d.struct({ resolution: d.vec2f, time: d.f32 })

const shaderCode = `
struct Uniforms {
  resolution: vec2f,
  time: f32,
}
@group(0) @binding(0) var<uniform> u: Uniforms;

@vertex
fn vs(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
  var pos = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  return vec4f(pos[i], 0.0, 1.0);
}

@fragment
fn fs(@builtin(position) fragCoord: vec4f) -> @location(0) vec4f {
  let uv = fragCoord.xy / u.resolution;
  let t = u.time;
  let c1 = vec3f(0.98, 0.36, 0.09);
  let c2 = vec3f(0.96, 0.13, 0.42);
  let c3 = vec3f(0.99, 0.72, 0.20);
  let wave = 0.5 + 0.5 * sin(uv.x * 3.0 + t * 1.6) * cos(uv.y * 2.0 - t * 1.1);
  let mixed = mix(mix(c1, c2, uv.x), c3, wave);
  return vec4f(mixed, 1.0);
}
`

const GRAD_COLORS = ["#fb5b15", "#f5216b"] as const
const GRAD_START = { x: 0, y: 0 }
const GRAD_END = { x: 1, y: 1 }

export function GpuButton({ label, onPress, disabled, height = 56 }: Props) {
  const ref = useCanvasEffect(async () => {
    try {
      const root = await tgpu.init()
      const device = root.device
      const canvas = ref.current
      if (!canvas) return
      const context = canvas.getContext("webgpu")
      if (!context) return

      const format = navigator.gpu.getPreferredCanvasFormat()
      context.configure({ device, format, alphaMode: "premultiplied" })

      const module = device.createShaderModule({ code: shaderCode })
      const pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: { module, entryPoint: "vs" },
        fragment: { module, entryPoint: "fs", targets: [{ format }] },
        primitive: { topology: "triangle-list" },
      })

      const uniforms = root.createBuffer(Uniforms).$usage("uniform")
      const uniformBuffer = root.unwrap(uniforms)
      const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
      })

      const start = performance.now()
      let raf = 0
      const frame = () => {
        const t = (performance.now() - start) / 1000
        const texture = context.getCurrentTexture()
        uniforms.write({ resolution: d.vec2f(texture.width, texture.height), time: t })

        const encoder = device.createCommandEncoder()
        const view = texture.createView()
        const pass = encoder.beginRenderPass({
          colorAttachments: [
            { view, clearValue: { r: 0, g: 0, b: 0, a: 1 }, loadOp: "clear", storeOp: "store" },
          ],
        })
        pass.setPipeline(pipeline)
        pass.setBindGroup(0, bindGroup)
        pass.draw(3)
        pass.end()
        device.queue.submit([encoder.finish()])
        if (typeof context.present === "function") context.present()
        raf = requestAnimationFrame(frame)
      }
      frame()
      return () => cancelAnimationFrame(raf)
    } catch (e) {
      console.warn("GpuButton: WebGPU kullanılamıyor, fallback gradyan aktif.", e)
    }
  })

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.wrap,
        { height, opacity: disabled ? 0.6 : pressed ? 0.9 : 1 },
      ]}
    >
      <LinearGradient
        colors={GRAD_COLORS}
        start={GRAD_START}
        end={GRAD_END}
        style={StyleSheet.absoluteFill}
      />
      <Canvas ref={ref} style={StyleSheet.absoluteFill} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  label: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
})