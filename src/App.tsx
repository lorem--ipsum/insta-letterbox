import { useCallback, useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.scss";

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
      </div>
      <div className="images">
        {files.map((file) => (
          <ImageResizer key={file.name} imageFile={file} color={color} />
        ))}
      </div>
    </div>
  );
}

interface ImageResizerProps {
  imageFile: File;
  color: string;
}

function ImageResizer(props: ImageResizerProps) {
  const { imageFile, color } = props;

  const [loading, setLoading] = useState(false);
  const [dataUrl, setDataUrl] = useState("");

  const onLoad = useCallback((e: ProgressEvent<FileReader>) => {
    var img = document.createElement("img");

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

      // Actual resizing
      ctx.drawImage(
        img,
        (size - width) / 2,
        (size - height) / 2,
        width,
        height
      );

      // Show resized image in preview element
      setDataUrl(canvas.toDataURL(imageFile.type));

      setLoading(false);
    };

    img.src = e.target!.result as any;
  }, []);

  var reader = new FileReader();
  reader.onload = onLoad;

  useEffect(() => {
    if (loading) {
      reader.abort();
      setLoading(false);
    }

    setLoading(true);
    reader.readAsDataURL(imageFile);

    return () => {
      reader.abort();
    };
  }, [imageFile]);

  if (loading) {
    return (
      <div className="image-resizer loading">
        <div>Working...</div>
      </div>
    );
  }

  return (
    <a className="image-resizer" download={imageFile.name} href={dataUrl}>
      <img id="preview" src={dataUrl} />
    </a>
  );
}

export default App;
