const LoadingPost = () => {
  return (
    <div className="w-full h-[200px] md:rounded-xl bg-200 px-3 pt-3 pb-6">
      <div className="flex flex-col justify-between h-full">
        <div className="user-info w-fit flex gap-2">
          <div className="circle w-12 loading"></div>
          <div className="flex flex-col gap-2 justify-center">
            <div className="h-2 loading rounded-xl w-[100px]"></div>
            <div className="h-2 loading rounded-xl w-[80px]"></div>
          </div>
        </div>
        <div className="reactions flex w-full justify-around">
          <div className="w-20 loading h-2 rounded-xl"></div>
          <div className="w-20 loading h-2 rounded-xl"></div>
          <div className="w-20 loading h-2 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingPost;
