"use client";

import { useRef, useState, useEffect } from "react";

import * as THREE from "three";
import { Water } from 'three-stdlib';

const GamePage: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const boatRef = useRef<THREE.Mesh | null>(null);

  // Скорость лодки
  const [boatSpeed, setBoatSpeed] = useState(0);

  useEffect(() => {
    // Сцена
    const scene = new THREE.Scene();

    // Создаем камеру
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 20, 10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Рендерер
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Реалистичная вода
    const waterGeometry = new THREE.PlaneGeometry(1000, 1000);
    const water = new Water(waterGeometry, {
      textureWidth: 256,
      textureHeight: 256,
      waterNormals: new THREE.TextureLoader().load("textures/bfd05d5aac1ccf083d71323674120bb5.jpg", function(texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      }),
      sunDirection: new THREE.Vector3(0.707, 0.707, 0),
      sunColor: 0xf0f0f0,
      waterColor: 0x00aaff, // Ярко-синий цвет
      distortionScale: 0.5,
      fog: scene.fog !== undefined
    });
    water.rotation.x = -Math.PI / 2;
    scene.add(water);

    // Создаем лодку
    const boatGeometry = new THREE.BoxGeometry(1, 0.5, 2);
    const boatMaterial = new THREE.MeshStandardMaterial({
      color: 0x8b4513,
      metalness: 0.1,
      roughness: 0.4
    });
    const boat = new THREE.Mesh(boatGeometry, boatMaterial);
    boat.position.y = 0.25;
    scene.add(boat);
    boatRef.current = boat;

    // Создаем препятствия
    const obstacleGeometry = new THREE.BoxGeometry(2, 1, 2);
    const obstacleMaterial = new THREE.MeshStandardMaterial({
      color: 0xff0000,
      metalness: 0.9,
      roughness: 0.1
    });

    for (let i = 0; i < 10; i++) {
      const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
      obstacle.position.set(
        Math.random() * 20 - 10,
        0.5,
        Math.random() * -50
      );
      scene.add(obstacle);
    }

    // Добавляем основное окружающее освещение
    const ambientLight = new THREE.AmbientLight(0x404040); // мягкий серый цвет
    scene.add(ambientLight);

    // Направленный свет сверху
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    // Освещение с неба
    const skyLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 10.5);
    scene.add(skyLight);

    // Точечное освещение для глубины сцены
    const pointLight = new THREE.PointLight(0xffffff, 0.7, 300);
    pointLight.position.set(0, 10, 50);
    scene.add(pointLight);

    let waveAmplitude = 0.05; // Амплитуда колебаний лодки
    let waveFrequency = 0.01; // Частота колебаний лодки

    // Анимация
    const animate = () => {
      requestAnimationFrame(animate);

      // Двигаем лодку вперед
      if (boatRef.current) {
        boatRef.current.position.z -= boatSpeed;
        
        // Синхронизация движения лодки с волнами
        boatRef.current.position.y = 0.25 + Math.sin(Date.now() * waveFrequency) * waveAmplitude;

        // Обновляем позицию камеры
        if (cameraRef.current) {
          camera.position.x = boatRef.current.position.x;
          camera.position.z = boatRef.current.position.z + 5; // Камера немного позади лодки
          camera.position.y = 5; // Высота камеры
          camera.lookAt(boatRef.current.position); // Камера смотрит на лодку
        }
      }

      // Проверка столкновений
      scene.children.forEach((child) => {
        if (child !== water && child !== boatRef.current) {
          if (
            boatRef.current &&
            boatRef.current.position.distanceTo(child.position) < 1.5
          ) {
            console.log("Collision detected!");
          }
        }
      });

      // Обновление времени для воды
      water.material.uniforms["time"].value += 1.0 / 60.0;

      // Проверка наличия камеры перед рендерингом
      if (cameraRef.current) {
        renderer.render(scene, cameraRef.current);
      }
    };

    animate();

    // Очистка при размонтировании компонента
    return () => {
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Обработка событий клавиатуры
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowUp":
          setBoatSpeed(0.15);
          break;
        case "ArrowDown":
          setBoatSpeed(-0.15);
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case "ArrowUp":
        case "ArrowDown":
          setBoatSpeed(0);
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Обработка событий мыши
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (boatRef.current) {
        const deltaX = e.movementX;
        boatRef.current.rotation.y += deltaX * 0.005;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return <div ref={mountRef} />;
};

export default GamePage;