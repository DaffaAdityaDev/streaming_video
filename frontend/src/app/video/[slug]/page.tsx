import { PlayerVideo } from "@/components/molecules/PlayerVideo/page"
import Link from 'next/link'

export default function Page({params, searchParams }: { params: { slug: string }, searchParams: { [key: string]: string | string[] | undefined }}) {
    return (
        <div>
            <Link href={`/`}>
                Back to home
            </Link>
            <h1>Video</h1>
            <p>{params.slug}</p>
            <p>{searchParams.quality}</p>
            <PlayerVideo src={params.slug} quality={Array.isArray(searchParams.quality) ? searchParams.quality[0] : (searchParams.quality || 'defaultQuality')} />
        </div>
    )
}