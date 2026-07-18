import { useEffect, useRef, useState } from "react";
import {
  PixelRatio,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { Canvas, type CanvasRef } from "react-native-webgpu";
import tgpu from "typegpu";
import * as d from "typegpu/data";

const Uniforms = d.struct({
  resolution: d.vec2f,
  time: d.f32,
  frozen: d.f32,
});

const shaderCode = /* wgsl */ `
struct Uniforms {
  resolution: vec2f,
  time: f32,
  frozen: f32,
};
@group(0) @binding(0) var<uniform> u: Uniforms;

fn hash(p: vec2f) -> f32 {
  return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453);
}
fn noise(p: vec2f) -> f32 {
  let i = floor(p);
  let f = fract(p);
  let a = hash(i);
  let b = hash(i + vec2f(1.0, 0.0));
  let c = hash(i + vec2f(0.0, 1.0));
  let dd = hash(i + vec2f(1.0, 1.0));
  let sw = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, sw.x), mix(c, dd, sw.x), sw.y);
}

@vertex
fn vmain(@builtin(vertex_index) i: u32) -> @builtin(position) vec4f {
  var p = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  return vec4f(p[i], 0.0, 1.0);
}

@fragment
fn fmain(@builtin(position) frag: vec4f) -> @location(0) vec4f {
  let uv = frag.xy / u.resolution; // uv.y: 0 üst -> 1 alt
  let t = u.time;

  // ---- KIRMIZI SU ----
  let baseLevel = 0.46 + 0.015 * sin(t * 0.8);
  let wave = 0.028 * sin(uv.x * 9.0 + t * 2.2)
           + 0.018 * sin(uv.x * 16.0 - t * 3.1);
  let surface = baseLevel + wave;
  let fill = smoothstep(surface, surface + 0.012, uv.y);
  let flow = 0.5 + 0.5 * sin(uv.x * 6.0 - t * 1.6 + sin(uv.y * 10.0 + t));
  let depth = clamp((uv.y - surface) / (1.0 - surface), 0.0, 1.0);
  var waterCol = mix(vec3f(0.95, 0.19, 0.25), vec3f(0.58, 0.04, 0.09), depth);
  waterCol = waterCol + flow * 0.10;
  let crest = smoothstep(0.02, 0.0, abs(uv.y - surface));
  waterCol = waterCol + crest * vec3f(0.95, 0.55, 0.55) * 0.5;
  let waterAlpha = clamp(fill * 0.80 + crest * 0.25, 0.0, 1.0);

  // ---- BUZ ----
  let n1 = noise(uv * 6.0 + vec2f(0.0, t * 0.05));
  let n2 = noise(uv * 14.0 - vec2f(t * 0.03, 0.0));
  let facets = noise(uv * 22.0);
  let frost = n1 * 0.6 + n2 * 0.3 + facets * 0.1;
  var iceCol = mix(vec3f(0.62, 0.78, 0.92), vec3f(0.93, 0.97, 1.0), frost);
  let crack = smoothstep(0.45, 0.5, abs(fract(frost * 3.0) - 0.5));
  iceCol = iceCol + crack * 0.15;
  let spark = step(0.985, noise(uv * 40.0 + vec2f(t * 0.2, -t * 0.15)));
  iceCol = iceCol + spark * 0.6;
  let iceAlpha = 0.9;

  // ---- KARIŞIM (frozen: 0 -> su, 1 -> buz) ----
  let col = mix(waterCol, iceCol, u.frozen);
  let alpha = clamp(mix(waterAlpha, iceAlpha, u.frozen), 0.0, 1.0);

  return vec4f(col * alpha, alpha); // premultiplied
}
`;

type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  frozen?: boolean;
};

export function GpuButton({ label, onPress, disabled, frozen }: Props) {
  const ref = useRef<CanvasRef>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const frozenCurrent = useRef(0);
  const frozenTarget = useRef(0);
  frozenTarget.current = frozen ? 1 : 0; // her render'da hedefi güncelle

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  useEffect(() => {
    if (!size.width || !size.height) return;
    let raf = 0;
    let disposed = false;
    let root: Awaited<ReturnType<typeof tgpu.init>> | undefined;

    (async () => {
      root = await tgpu.init();
      if (disposed) {
        root.destroy();
        return;
      }
      const device = root.device;
      const context = ref.current?.getContext("webgpu");
      if (!context) return;

      const canvas = context.canvas as HTMLCanvasElement;
      const dpr = PixelRatio.get();
      canvas.width = Math.max(1, Math.floor(size.width * dpr));
      canvas.height = Math.max(1, Math.floor(size.height * dpr));

      const format = navigator.gpu.getPreferredCanvasFormat();
      context.configure({ device, format, alphaMode: "premultiplied" });

      const module = device.createShaderModule({ code: shaderCode });
      const pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: { module, entryPoint: "vmain" },
        fragment: { module, entryPoint: "fmain", targets: [{ format }] },
        primitive: { topology: "triangle-list" },
      });

      const uniforms = root.createBuffer(Uniforms).$usage("uniform");
      const bindGroup = device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: { buffer: root.unwrap(uniforms) } }],
      });

      const start = Date.now();
      const frame = () => {
        if (disposed) return;
        const time = (Date.now() - start) / 1000;
        // yumuşak donma geçişi
        frozenCurrent.current +=
          (frozenTarget.current - frozenCurrent.current) * 0.12;

        uniforms.write({
          resolution: d.vec2f(canvas.width, canvas.height),
          time,
          frozen: frozenCurrent.current,
        });

        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: context.getCurrentTexture().createView(),
              clearValue: [0, 0, 0, 0],
              loadOp: "clear",
              storeOp: "store",
            },
          ],
        });
        pass.setPipeline(pipeline);
        pass.setBindGroup(0, bindGroup);
        pass.draw(3);
        pass.end();
        device.queue.submit([encoder.finish()]);
        context.present?.();
        raf = requestAnimationFrame(frame);
      };
      frame();
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      root?.destroy();
    };
  }, [size.width, size.height]);

  const notClickable = disabled || frozen;

  return (
    <Pressable
      onPress={onPress}
      disabled={notClickable}
      onLayout={onLayout}
      style={[styles.button, frozen && styles.frozenBorder]}
    >
      {size.width > 0 ? (
        <Canvas ref={ref} style={StyleSheet.absoluteFill} transparent />
      ) : null}
      <View style={styles.labelWrap} pointerEvents="none">
        <Text style={[styles.label, frozen && styles.labelFrozen]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    width: "100%",
    borderRadius: 999,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  frozenBorder: { borderColor: "rgba(180,220,255,0.55)" },
  labelWrap: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  labelFrozen: { color: "#0a2540", textShadowColor: "rgba(255,255,255,0.6)" },
});