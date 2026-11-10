# Next Platform Enhancements Plan

## Section 1: Camera Ingestion & Video Processing
- **1.1**: Add multi-camera device selector dropdown allowing users with multiple connected webcams (front, back, external USB) to switch cameras seamlessly in Live mode. `[TODO]`
- **1.2**: Implement custom digital zoom (1x to 4x) and pan controls directly on the live camera viewport with mouse wheel and drag support. `[TODO]`
- **1.3**: Add client-side frame brightness, contrast, and exposure adjustment sliders to optimize detection in low-light environments. `[TODO]`

## Section 2: Model Architecture & Inference Pipeline
- **2.1**: Implement client-side custom model weight file uploader (`.json` / `.bin` or ONNX model files) allowing users to test their own custom-trained detectors. `[TODO]`
- **2.2**: Integrate WebGPU acceleration backend option alongside WebGL and WASM for ultra-low latency inference on compatible modern browsers. `[TODO]`
- **2.3**: Add automated benchmark stress test tool that runs 100 consecutive frames through each model and outputs a performance comparison table with mean latency, memory footprint, and jitter. `[TODO]`

## Section 3: Bounding Box & Target Visualizations
- **3.1**: Implement 2D motion trajectory trails that track and draw the historical velocity path of moving objects across the frame over the last 30 frames. `[TODO]`
- **3.2**: Add customizable alert boundaries and virtual tripwire zones where crossing a user-drawn line triggers visual alarms and timestamped logging. `[TODO]`
- **3.3**: Provide bounding box label position auto-adaptation to prevent labels from overlapping or clipping against screen boundaries when objects touch the edges. `[TODO]`

## Section 4: Data Telemetry, Analytics & Export
- **4.1**: Implement time-series line chart showing real-time object count and FPS history over the past 60 seconds with peak detection spikes. `[TODO]`
- **4.2**: Add automated continuous interval snapshot recording (e.g., capture every 5s / 10s / 30s) with zip export for dataset generation. `[TODO]`
- **4.3**: Integrate CSV telemetry export option to download a timestamped log containing frame index, detection latency, detected classes, and bounding coordinates. `[TODO]`
