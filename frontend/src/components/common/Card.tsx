'use client';
import React, { useState } from 'react';
import Link from 'next/link';

type CardVariant = 'default' | 'skeleton' | 'compact';

interface CardProps {
  variant?: CardVariant;
  url?: string;
  img?: string;
  title?: string;
  quality?: string;
  description?: string;
}

const Card: React.FC<CardProps> = ({
  variant = 'default',
  url,
  img,
  title,
  quality,
  description,
}) => {
  const [imgError, setImgError] = useState(false);

  const renderImage = () => {
    if (img && !imgError) {
      return (
        <img
          src={img}
          alt={title || 'Card image'}
          className="aspect-video h-auto w-full rounded-md object-cover"
          onError={() => setImgError(true)}
        />
      );
    } else {
      return (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-md bg-slate-800">
          <div className="relative">
            {/* <div className='absolute inset-0 w-full h-full bg-blue-800 rounded-md flex flex-col gap-2 items-center justify-center' /> */}
            <img
              src="/svg/image-gallery-white.svg"
              alt={title || 'Card image'}
              className="aspect-video h-20 w-20 rounded-md object-cover"
            />
          </div>
          <p className="text-sm text-white">No image</p>
        </div>
      );
    }
  };

  const cardContent = (
    <>
      {renderImage()}
      {title && <h2 className="mt-2 text-lg font-semibold">{title}</h2>}
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      {quality && <p className="mt-1 text-sm text-gray-500">{quality}</p>}
    </>
  );

  if (variant === 'skeleton') {
    return (
      <div className="h-full w-full animate-pulse overflow-hidden rounded-md">
        <div className="aspect-video w-full bg-slate-800"></div>
        <div className="mt-2 h-4 w-3/4 rounded bg-slate-800"></div>
        <div className="mt-2 h-4 w-1/2 rounded bg-slate-800"></div>
      </div>
    );
  }

  const wrapperClasses = `h-full w-full overflow-hidden rounded-md`;

  return (
    <div className={wrapperClasses}>
      {url ? <Link href={url || '#'}>{cardContent}</Link> : cardContent}
    </div>
  );
};

export default Card;
