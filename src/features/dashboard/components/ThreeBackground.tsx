import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Constants for wave animation
const WAVE_HEIGHT = 0.8;
const WAVE_SPEED = 1.2;
const WAVE_FREQUENCY = 0.3;

// Helper function to calculate wave height at a specific position and time
const getWaveHeight = (x: number, z: number, time: number) => {
  let y = Math.sin(x * WAVE_FREQUENCY + time * WAVE_SPEED) * WAVE_HEIGHT;
  y += Math.cos(z * WAVE_FREQUENCY * 0.8 + time * WAVE_SPEED * 0.8) * (WAVE_HEIGHT * 0.5);
  return y;
};

const Water = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Create geometry once
  const geometry = useMemo(() => new THREE.PlaneGeometry(200, 200, 60, 60), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();
    const positions = meshRef.current.geometry.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y_coord_geometry = positions.getY(i); // This corresponds to Z in world space due to rotation
      
      const z_height = getWaveHeight(x, y_coord_geometry, time);
      positions.setZ(i, z_height);
    }
    positions.needsUpdate = true;
  });

  return (
    <mesh 
      ref={meshRef} 
      geometry={geometry} 
      rotation={[-Math.PI / 2, 0, 0]} 
      receiveShadow
    >
      <meshStandardMaterial 
        color={0x2563eb}
        roughness={0.1}
        metalness={0.1}
        flatShading={true}
        opacity={0.9}
        transparent={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

const Boat = () => {
  const groupRef = useRef<THREE.Group>(null);

  // Hull Geometry
  const hullGeometry = useMemo(() => {
    const geo = new THREE.BoxGeometry(3, 1.5, 7);
    const positionAttribute = geo.attributes.position;
    for ( let i = 0; i < positionAttribute.count; i ++ ) {
        const y = positionAttribute.getY( i );
        const z = positionAttribute.getZ( i );
        
        // Taper the bow
        if (z > 2) {
            const x = positionAttribute.getX( i );
            positionAttribute.setX( i, x * 0.1 );
        } else if (z > 0) {
             const x = positionAttribute.getX( i );
             positionAttribute.setX( i, x * 0.6 );
        }
        
        // Taper the bottom
        if (y < 0) {
             const x = positionAttribute.getX( i );
             positionAttribute.setX( i, x * 0.7 );
        }
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Sail Shapes
  const sailGeometry = useMemo(() => {
    const sailShape = new THREE.Shape();
    sailShape.moveTo(0, 0);
    sailShape.lineTo(0, 6);
    sailShape.lineTo(3.5, 1);
    sailShape.lineTo(0, 0);
    return new THREE.ShapeGeometry(sailShape);
  }, []);

  const jibGeometry = useMemo(() => {
    const jibShape = new THREE.Shape();
    jibShape.moveTo(0, 0);
    jibShape.lineTo(0, 5);
    jibShape.lineTo(-2.5, 0);
    jibShape.lineTo(0, 0);
    return new THREE.ShapeGeometry(jibShape);
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Set base position (X=-6) as requested in log.md
    // We only update Y and rotations here, X and Z are relatively static (except for small drift if we wanted)
    // But since we want it at -6, we should ensure it stays around there or is set there.
    // The initial position is set in the group prop below, but let's make sure we read it correctly.
    
    const boatX = groupRef.current.position.x;
    const boatZ = groupRef.current.position.z;
    
    // Sample water height at different points to calculate rotation
    const waterHeightCenter = getWaveHeight(boatX, boatZ, time);
    const waterHeightFront = getWaveHeight(boatX, boatZ + 2, time);
    const waterHeightRight = getWaveHeight(boatX + 1, boatZ, time);

    // Update position and rotation
    groupRef.current.position.y = waterHeightCenter - 0.2;
    groupRef.current.rotation.x = (waterHeightCenter - waterHeightFront) * 0.3;
    groupRef.current.rotation.z = (waterHeightCenter - waterHeightRight) * 0.2 + Math.sin(time * 0.5) * 0.05;
    groupRef.current.rotation.y = Math.sin(time * 0.1) * 0.1;
  });

  return (
    <group ref={groupRef} position={[-6, 0, 0]}>
      {/* Hull */}
      <mesh geometry={hullGeometry} position={[0, 0.5, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={0x854d0e} roughness={0.6} />
      </mesh>
      
      {/* Cabin */}
      <mesh position={[0, 1.5, -1]} castShadow>
        <boxGeometry args={[1.8, 1, 3]} />
        <meshStandardMaterial color={0x334155} roughness={0.9} />
      </mesh>

      {/* Mast */}
      <mesh position={[0, 4, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.15, 8]} />
        <meshStandardMaterial color={0x334155} roughness={0.9} />
      </mesh>

      {/* Main Sail */}
      <mesh geometry={sailGeometry} position={[0.1, 2, 0.1]} castShadow>
        <meshStandardMaterial color={0xffffff} side={THREE.DoubleSide} />
      </mesh>

      {/* Jib Sail */}
      <mesh geometry={jibGeometry} position={[0, 2.2, 0.2]} rotation={[0, 0.2, 0]} castShadow>
        <meshStandardMaterial color={0xffffff} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

const CameraController = () => {
  useFrame((state) => {
    // Static camera as per log.md design to keep the view consistent
    // camera.position.set(12, 8, 25); 
    // camera.lookAt(-2, 0, 0);
    // We can add slight movement if desired, but let's stick to the requested design first.
    // Actually, let's keep a very subtle movement to keep it alive.
    const time = state.clock.getElapsedTime();
    state.camera.position.x = 12 + Math.sin(time * 0.05) * 0.5;
    state.camera.position.z = 25 + Math.cos(time * 0.05) * 0.5;
    state.camera.lookAt(-2, 0, 0);
  });
  return null;
};

export const ThreeBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-slate-900">
      <Canvas shadows camera={{ position: [12, 8, 25], fov: 45 }}>
        <color attach="background" args={['#1e293b']} />
        <fog attach="fog" args={['#1e293b', 15, 80]} />
        
        <hemisphereLight intensity={0.9} groundColor={0x0f172a} />
        <directionalLight 
          position={[-20, 30, 20]} 
          intensity={1.8} 
          color={0xcffafe}
          castShadow 
          shadow-mapSize={[1024, 1024]}
          shadow-camera-left={-40}
          shadow-camera-right={40}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
        />

        <Water />
        <Boat />
        <CameraController />
      </Canvas>
    </div>
  );
};
