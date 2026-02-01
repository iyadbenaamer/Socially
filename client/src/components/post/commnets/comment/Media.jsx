import { useMediaViewer } from "components/media-viewer/MediaViewerContext";

const Media = (props) => {
  const { children, file, files, startIndex = 0 } = props;
  const { openMediaViewer } = useMediaViewer();

  const handleOpen = () => {
    const list = files || (file ? [file] : []);
    if (!list.length) return;
    openMediaViewer(list, startIndex);
  };

  return <div onClick={handleOpen}>{children}</div>;
};

export default Media;
