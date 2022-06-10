import { useCallback, useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.scss";
const piexif = require("piexifjs");

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [color, setColor] = useState("#ffffff");

  const onColorChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      setColor(e.target.value);
    },
    []
  );

  const onChange: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      setFiles(Array.from((e.target as HTMLInputElement).files || []));
    },
    []
  );

  const remove = useCallback((file: File) => {
    setFiles(files.filter((f) => f.name !== file.name));
  }, []);

  const clear = useCallback(() => {
    setFiles([]);
  }, []);

  return (
    <div className="App">
      <div className="input-area">
        <div className="group">
          <label htmlFor="files">Images</label>
          <input
            name="files"
            type="file"
            accept="image/*"
            multiple
            onChange={onChange}
          />
        </div>
        <div className="group">
          <label htmlFor="color">Background color</label>
          <input
            name="color"
            type="color"
            value={color}
            onChange={onColorChange}
          />
        </div>
        <div className="spacer" />
        <div className="group">
          <button onClick={clear}>Clear</button>
        </div>
      </div>
      <div className="images">
        {files.map((file) => (
          <ImageResizer
            key={file.name}
            onRemove={() => remove(file)}
            imageFile={file}
            color={color}
          />
        ))}
      </div>
    </div>
  );
}

interface ImageResizerProps {
  imageFile: File;
  color: string;
  onRemove: () => void;
}

function ImageResizer(props: ImageResizerProps) {
  const { imageFile, color, onRemove } = props;

  const [loadingState, setLoadingState] = useState<
    "init" | "loading" | "error" | "success"
  >("init");
  const [dataUrl, setDataUrl] = useState("");
  const [exifError, setExifError] = useState("");

  const onLoad = useCallback((e: ProgressEvent<FileReader>) => {
    const img = document.createElement("img");

    let exifObj = {};

    try {
      exifObj = piexif.load(e.target!.result);
    } catch (e) {
      setExifError(String(e));
    }

    img.onload = function(event) {
      // picture dimensions
      const { width, height } = img;
      const size = Math.max(width, height);

      // Dynamically create a canvas element
      var canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;

      var ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

      ctx.fillStyle = color;
      ctx.fillRect(0, 0, size, size);

      // Centering the image
      ctx.drawImage(
        img,
        (size - width) / 2,
        (size - height) / 2,
        width,
        height
      );

      let newDataUrl = canvas.toDataURL(imageFile.type);

      try {
        newDataUrl = piexif.insert(piexif.dump(exifObj), newDataUrl);
      } catch (e) {
        setExifError(String(e));
      }

      // Show resized image in preview element
      setDataUrl(newDataUrl);

      setLoadingState("success");
    };

    img.src = e.target!.result as any;
  }, []);

  var reader = new FileReader();
  reader.onload = onLoad;

  useEffect(() => {
    if (loadingState) {
      reader.abort();
      setLoadingState("init");
    }

    setLoadingState("loading");
    reader.readAsDataURL(imageFile);

    return () => {
      reader.abort();
    };
  }, [imageFile]);

  if (loadingState === "loading") {
    return (
      <div className="image-resizer loading">
        <div>Working...</div>
      </div>
    );
  }

  return (
    <div className="image-resizer">
      <a download={imageFile.name} href={dataUrl}>
        <img id="preview" src={dataUrl} />
        {exifError && (
          <div className="exif-error">Unable to read or write EXIF data</div>
        )}
      </a>
      <div className="label" title={imageFile.name}>
        {imageFile.name}
      </div>
      <div className="remove" onClick={onRemove}>
        Remove
      </div>
    </div>
  );
}

export default App;
