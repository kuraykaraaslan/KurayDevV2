import dynamic from "next/dynamic";
const MyImageVideoDialog = dynamic(() => import("./MyImageVideoDialog"), { ssr: false });

const MyImage = () => {

  return (
    <>
      <div className="relative flex-none hidden sm:block group">
        <div className="shadow-2xl max-w-24 sm:max-w-48 md:max-w-64 transition duration-500 transform bg-primary">
          <img
            src="/assets/img/kuraykaraaslan.jpg"
            alt="kuray karaaslan"
            className="transition duration-500 transform"
          />
        </div>
        <div className="absolute top-0 shadow-2xl max-w-24 sm:max-w-48 md:max-w-64 transition duration-500 transform bg-transparent w-full h-full opacity-0 group-hover:opacity-100">
          <MyImageVideoDialog />
        </div>
      </div>
    </>
  );
};

export default MyImage;
