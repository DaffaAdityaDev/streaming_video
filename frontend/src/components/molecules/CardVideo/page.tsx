import Link from "next/link"

export default function CardVideo({ img, title, description, slug, quality }: { img: string, title: string, description: string, slug: string, quality: string }) {
    return (
        <div className="w-full h-full bg-gray-200 rounded-md overflow-hidden shadow-md hover:shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 cursor-pointer">
            <Link href={`/video/${slug}?quality=${quality}`}>
                <img src={img} alt={title} />
                <h2>{title}</h2>
                <p>{description}</p>
                <p>{quality}</p>
            </Link>
        </div>
    )
}