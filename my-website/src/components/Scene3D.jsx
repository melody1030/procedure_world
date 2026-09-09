import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import TerrainGrid3D from './TerrainGrid3D'

export default function Scene3D({ geometry, wireframeGeometry, isRunning }) {
  return (
    <Canvas camera={{ position: [3.2, 3, 3.2], fov: 45 }}>
      <color attach="background" args={['#11131a']} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 2]} intensity={1.2} />
      <TerrainGrid3D geometry={geometry} wireframeGeometry={wireframeGeometry} isRunning={isRunning} />
      <gridHelper args={[6, 12, '#3a3d4a', '#22242c']} position={[0, -1.01, 0]} />
      <OrbitControls enableDamping dampingFactor={0.08} />
    </Canvas>
  )
}
