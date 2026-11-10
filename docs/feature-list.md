# VisionEdge Platform Feature List

## 1. Full-Screen Camera Viewport & Stream Ingestion
- **Immersive Full-Screen Experience**: The main screen is dedicated completely to the real-time device camera stream and its bounding box detections, with no other widgets appearing on the main screen.
- **Front vs. Rear Camera Selection**: Users can hot-swap between front-facing (user/selfie) and rear-facing (environment/back) cameras with a single tap on the on-screen camera switch button or via Settings.
- **Pixel-Perfect Bounding Box Fitting**: Uses mathematical aspect ratio and viewport containment scaling (`fitBoundingBoxToView`) so that bounding boxes align exactly with the real visual contours of detected objects on screen.
- **Always Live Mode**: Directly connects to the device's hardware webcam (`navigator.mediaDevices.getUserMedia`) without demo or mock fallbacks.
- **Shutter Snapshot**: Quick camera shutter button to freeze frames with bounding boxes and confidence scores.
- **Inactivity Auto-Hide (3 Seconds)**: Floating HUD controls (status pill, mode switcher, camera swap, settings gear, variant switcher, and shutter button) automatically fade out after 3 seconds of user inactivity for an ultra-clean, uninterrupted full-screen experience. Any mouse movement, touch gesture, click, or tap immediately brings controls back into view.

## 2. All 11 Supported Browser Object Detectors
- **TensorFlow.js (COCO-SSD)**: Standard browser-native MobileNet SSD with WebGL hardware acceleration.
- **MediaPipe Object Detector**: Google MediaPipe Tasks Vision with EfficientDet-Lite WebAssembly delegate.
- **ONNX Runtime Web**: Microsoft ONNX Runtime Web with cross-platform WebAssembly and WebGPU execution.
- **Transformers.js (YOLOS / DETR)**: Hugging Face Transformers.js visual transformer attention detector.
- **Ultralytics YOLO (ONNX / TF.js)**: Ultralytics YOLOv8 / YOLOv11 anchor-free real-time object detector.
- **Roboflow inference.js**: Roboflow edge-optimized computer vision runtime for custom and COCO models.
- **ml5.js Object Detector**: Creative coding ML library with accessible MobileNet/YOLO browser detection.
- **OpenCV.js DNN**: Official OpenCV WebAssembly Deep Neural Network (DNN) forward pass engine.
- **WebNN API (Hardware Accelerated)**: W3C Web Neural Network API tapping direct NPU, DirectML, and GPU hardware.
- **LiteRT.js (TensorFlow Lite Web)**: Google LiteRT next-gen lightweight flatbuffer runtime for edge devices.
- **Liquid AI d1-2B (LFM Vision)**: Liquid Foundation Model (LFM) continuous-time dynamic neural vision and visual grounding with direct Hugging Face Hub link.

## 3. Human Pose Estimation & Multi-Variant Tracking
- **Boxes vs. Pose vs. Combined**: 1-tap mode switcher between Object Boxes Only, Pose Only, or Both simultaneously.
- **4 Pose Tracking Variants**:
  - **Body Pose**: 33-point anatomical skeletal tracking with bone connections.
  - **Hand Tracking**: 21-point articulation per hand (left and right hands).
  - **Face Mesh / Contours**: 38 facial landmark contours (eyes, lips, brows, face oval).
  - **Holistic**: Full simultaneous multi-variant tracking.
- **Customizable Skeletons**: Neon Cyan, Rainbow Limbs, Emerald Glow, and Minimalist White themes.

## 4. Model Download & Memory Readiness Indicators
- **Download Status Badges**: Clear visual badges on each model card in Settings:
  - **Ready to Use** (Emerald checkmark): Model is downloaded, initialized, and cached in browser memory.
  - **Not Downloaded** (Amber disk): Model weights not yet downloaded into browser memory.
  - **Loading / Downloading** (Cyan spinner): Real-time progress percentage bar during browser caching.
- **Load into Browser Action**: Interactive button allowing users to download and initialize any model into their browser on demand.

## 5. High-Fidelity Bounding Box & Confidence Display
- **Explicit Confidence Reliability Display**: Each detected target displays its class name and numerical confidence score formatted as a clean percentage (e.g. `person 94.2%`).
- **Color-Coded Reliability Indicators**: Calibrated visual themes reflecting confidence tiers (High >= 80% Emerald, Medium 60-79% Cyan, Low < 60% Amber).
- **Customizable Bounding Box Styles**: Neon Glow, Solid High Contrast, Corner Reticles, and Minimal Outline.
- **Overlay HUD Features**: Optional center reticle dot for aiming/tracking, target tracking IDs, and class-specific color coding.

## 6. Settings Page & Detection Parameters
- **Dedicated Settings Page**: All detector configuration controls, hardware selections, and model architectures are centralized in a dedicated settings page, keeping the main camera screen clean and uncluttered.
- **Confidence Threshold Slider**: Fine-grained slider (10% to 95%) to filter low-confidence spurious predictions in real-time.
- **Max Detections Limit**: Control to bound the maximum number of simultaneous targets (1 to 25) to conserve browser compute.
- **Multi-Select Class Filtering**: Instant filter tags for common COCO classes (Person, Laptop, Cell phone, Cup, Bottle, Book, Chair, etc.).
- **Audio Proximity Cues**: Optional subtle audio notification when a new target enters the detection frame.

## 7. Snapshot Inspection & History Library
- **Inspection Snapshot Modal**: Frozen frame viewer with detailed tabular breakdown of detected objects, bounding box coordinates [x, y, w, h], pose count, and confidence scores.
- **JSON Metadata Export & Image Download**: One-click JSON metadata export to clipboard and high-resolution JPEG snapshot download.
- **Snapshot History Library**: Persistent gallery of past inspection snapshots stored across sessions.
