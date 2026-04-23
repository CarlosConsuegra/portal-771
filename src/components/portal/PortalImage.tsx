import Image from "next/image";

type PortalImageProps = {
  title: string;
  imageUrl: string;
};

export function PortalImage({ title, imageUrl }: PortalImageProps) {
  return (
    <figure className="w-full">
      <div className="mt-0.5 w-full md:mt-1">
        {imageUrl ? (
          <div className="relative mx-auto h-auto max-h-[72vh] w-[94vw] max-w-[1680px] md:w-[93vw]">
            <Image
              src={imageUrl}
              alt={title}
              width={1600}
              height={1200}
              priority
              sizes="(min-width: 1536px) 1680px, (min-width: 1024px) 93vw, 94vw"
              className="h-auto max-h-[72vh] w-full object-contain"
            />
          </div>
        ) : (
          <div className="mx-auto flex max-h-[72vh] h-[68vw] w-[94vw] max-w-[1680px] items-center justify-center bg-[#ece8e0] md:h-[58vw] md:w-[93vw]">
            <div className="h-full w-full bg-[repeating-linear-gradient(135deg,rgba(209,209,209,0.18),rgba(209,209,209,0.18)_2px,transparent_2px,transparent_18px)]" />
          </div>
        )}
      </div>
    </figure>
  );
}
