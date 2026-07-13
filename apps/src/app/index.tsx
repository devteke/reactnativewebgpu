import { useEffect, useRef } from "react";
import { PixelRatio, StyleSheet, View, useWindowDimensions } from "react-native";
import { Canvas, type CanvasRef } from "react-native-webgpu";
import tgpu from "typegpu";

const shaderCode = /* wgsl */ `
@vertex
fn vmain(@builtin(vertex_index) idx: u32) -> @builtin(position) vec4f {
  var pos = array<vec2f, 3>(
    vec2f( 0.0,  0.5),
    vec2f(-0.5, -0.5),
    vec2f( 0.5, -0.5)
  );
  return vec4f(pos[idx], 0.0, 1.0);
}

@fragment
fn fmain() -> @location(0) vec4f {
  return vec4f(0.98, 0.36, 0.09, 1.0);
}
`;

export default function HomeScreen() {
  const ref = useRef<CanvasRef>(null);
  const { width, height } = useWindowDimensions();

  useEffect(() => {
    if (!width || !height) return;
    let root: Awaited<ReturnType<typeof tgpu.init>> | undefined;

    (async () => {
      root = await tgpu.init();
      const device = root.device;

      const context = ref.current?.getContext("webgpu");
      if (!context) {
        console.log("[webgpu] context alınamadı");
        return;
      }

      const canvas = context.canvas as HTMLCanvasElement;
      canvas.width = width * PixelRatio.get();
      canvas.height = height * PixelRatio.get();

      const format = navigator.gpu.getPreferredCanvasFormat();
      context.configure({ device, format, alphaMode: "opaque" });

      const module = device.createShaderModule({ code: shaderCode });
      const pipeline = device.createRenderPipeline({
        layout: "auto",
        vertex: { module, entryPoint: "vmain" },
        fragment: { module, entryPoint: "fmain", targets: [{ format }] },
        primitive: { topology: "triangle-list" },
      });

      const encoder = device.createCommandEncoder();
      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: context.getCurrentTexture().createView(),
            clearValue: [0.04, 0.04, 0.06, 1],
            loadOp: "clear",
            storeOp: "store",
          },
        ],
      });
      pass.setPipeline(pipeline);
      pass.draw(3);
      pass.end();

      device.queue.submit([encoder.finish()]);
      context.present?.();
      console.log("[webgpu] çizildi", width, height);
    })();

    return () => {
      root?.destroy();
    };
  }, [width, height]);

  return (
    <View style={styles.container}>
      <Canvas ref={ref} style= {{width, height}}  />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0f" },
  canvas: { flex: 1 },
});