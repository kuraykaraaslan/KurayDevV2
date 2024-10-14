const MyImage = () => {

  return (
    <div className="relative flex-none hidden sm:block group">
      <div className="shadow-2xl max-w-24 sm:max-w-48 md:max-w-64 transition duration-500 transform group-hover:rotate-y-180 bg-primary">
        <img
          src="/assets/img/kuraykaraaslan.jpg"
          alt="kuray karaaslan"
          className="transition duration-500 transform"
        />
      </div>
      <div className="absolute top-0 shadow-2xl max-w-24 sm:max-w-48 md:max-w-64 transition duration-500 transform rotate-y-180 group-hover:rotate-y-0 bg-primary w-full h-full opacity-0 group-hover:opacity-100">
        <div className="relative w-full h-full flex flex-col">
          <div className="fixed flex flex-col uppercase left-2 top-2">
            <span className="text-2xl font-bold text-black ml-[0.4rem]">
              A
            </span>
            <img
              src="/assets/svg/spades.svg"
              alt="kuray karaaslan"
              className="h-8 w-8 transition"
            />
          </div>
          <div className="fixed flex flex-col uppercase mt-2 ml-2 right-2 bottom-2 transform rotate-180">
            <span className="text-2xl font-bold text-black ml-[0.4rem]">
              A
            </span>
            <img
              src="/assets/svg/spades.svg"
              className="h-8 w-8 transition"
            />
          </div>

          <div className="relative flex flex-col items-center justify-center w-full h-full">
            <img
              src="/assets/svg/spades.svg"
              className="h-16 w-16 transition"
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default MyImage;
