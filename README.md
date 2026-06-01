# **Connectid 🧠✨**

**Connectid** es una aplicación de escritorio nativa, ultraligera y de código abierto para la creación de mapas mentales, diagramas y estructuras conceptuales. Diseñada con un enfoque en el rendimiento y una interfaz "Soft UI" moderna.

## **✨ Características Principales**

* **Lienzo Infinito:** Zoom y paneo fluido sin límite de espacio.  
* **Herramientas de Diseño "Soft":** Formas geométricas personalizables (colores, bordes, tipografías, opacidad).  
* **Motor Magnético de Conexiones:** Líneas de conexión inteligentes con curvas Bézier cuadráticas que se adaptan y deslizan por los bordes de las figuras.  
* **Sincronización Híbrida (Offline-First):** Guarda tus proyectos localmente y sincronízalos automáticamente en la nube a través de Firebase.  
* **Edición en Lote:** Multi-selección, arrastre simultáneo y edición múltiple de propiedades.  
* **Modo Claro / Oscuro:** Integración nativa para la mejor experiencia visual en cualquier entorno.  
* **Exportación Rápida:** Respalda tus proyectos en archivos .json o exporta capturas en alta resolución .png.

## **🚀 Tecnologías**

Este proyecto está construido con herramientas modernas enfocadas en el rendimiento:

* **Tauri:** Framework para construir aplicaciones de escritorio más ligeras, rápidas y seguras.  
* **React 18 \+ Vite:** Interfaz de usuario reactiva y compilación ultrarrápida.  
* **Tailwind CSS \+ Framer Motion:** Estilos utilitarios y animaciones fluidas/físicas.  
* **Firebase:** Autenticación y base de datos (Firestore).  
* **Zustand & Context API:** Manejo de estados globales y locales.

## **🛠️ Instalación y Desarrollo Local**

### **Requisitos Previos**

* Node.js (v18+)  
* Rust y Cargo (Instrucciones en [rustup.rs](https://rustup.rs/))

### **Pasos para iniciar**

1. Clona este repositorio:  
   git clone \[https://github.com/tu-usuario/connectid.git\](https://github.com/tu-usuario/connectid.git)  
   cd connectid

2. Instala las dependencias:  
   npm install

3. Configura tus variables de entorno creando un archivo .env en la raíz (usa .env.example como guía para tus credenciales de Firebase).  
4. Inicia el servidor de desarrollo:  
   npm run tauri dev

## **📦 Compilación (Build)**

Para generar los instaladores nativos para tu sistema operativo (.exe, .dmg, .AppImage), ejecuta:

npm run tauri build

Los archivos compilados se encontrarán en la ruta src-tauri/target/release/bundle/.

## **🤝 Contribuir**

¡Las contribuciones son bienvenidas\! Si deseas mejorar Connectid, por favor lee nuestras [Guías de Contribución](http://docs.google.com/CONTRIBUTING.md) antes de enviar un Pull Request.

## **📄 Licencia**

Este proyecto está bajo la Licencia Pública General de GNU v3.0 (GPLv3). Consulta el archivo [LICENSE](http://docs.google.com/LICENSE) para más detalles.