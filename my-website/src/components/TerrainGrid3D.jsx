import * as THREE from 'three'

// Presentational: the geometry itself (including any live erosion) is
// owned and mutated by useTerrainSimulation. The wireframe overlay is
// hidden while the simulation runs — it's a static snapshot that would
// otherwise drift out of sync with the eroding surface every frame.
export default function TerrainGrid3D({ geometry, wireframeGeometry, isRunning }) {
  if (!geometry) return null

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial vertexColors roughness={0.85} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>
      {!isRunning && wireframeGeometry && (
        <lineSegments geometry={wireframeGeometry}>
          <lineBasicMaterial color="#000000" transparent opacity={0.15} />
        </lineSegments>
      )}
    </group>
  )
}
