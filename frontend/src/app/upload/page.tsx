import React from 'react'

export default function Upload() {
  return (
    <div className='w-full col-span-11 row-span-5'>
      <input type="file" className="file-input file-input-bordered file-input-info w-full max-w-xs" />
      <div className="form-control w-full max-w-xs">
        <label className="label">
          <span className="label-text">What is your name?</span>
          <span className="label-text-alt">Top Right label</span>
        </label>
        <input type="text" placeholder="Type here" className="input input-bordered w-full max-w-xs" />
        <label className="label">
          <span className="label-text-alt">Bottom Left label</span>
          <span className="label-text-alt">Bottom Right label</span>
        </label>
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Your bio</span>
          <span className="label-text-alt">Alt label</span>
        </label>
        <textarea className="textarea textarea-bordered h-24" placeholder="Bio"></textarea>
        <label className="label">
          <span className="label-text-alt">Your bio</span>
          <span className="label-text-alt">Alt label</span>
        </label>
      </div>
    </div>
  )
}
