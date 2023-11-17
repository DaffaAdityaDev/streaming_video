import { PlayerVideoMolecules } from "@/components/molecules/PlayerVideo"
import Link from 'next/link'

export default function VideoPlayerPage({params, searchParams }: { params: { slug: string }, searchParams: { [key: string]: string | string[] | undefined }}) {
    return (
        <div>
            <Link href={`/`}>
                Back to home
            </Link>
            <h1>Video</h1>
            <p>{params.slug}</p>
            <p>{searchParams.quality}</p>
            <PlayerVideoMolecules src={params.slug} quality={Array.isArray(searchParams.quality) ? searchParams.quality[0] : (searchParams.quality || 'defaultQuality')} />
        </div>
    )
}