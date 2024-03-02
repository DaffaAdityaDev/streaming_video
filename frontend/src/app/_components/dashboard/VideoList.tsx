import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FormGeneratorTemplateItem, ListVideo } from '@/app/types';

export default function VideoList({ email }: any) {
  const [videos, setVideos] = useState<ListVideo[]>([]);
  const [editingVideoId, setEditingVideoId] = useState<number>(0);
  const [FormSelected, setFormSelected] = useState(0);
  const [formGeneratorTemplate, setFormGeneratorTemplate] = useState<FormGeneratorTemplateItem[]>(
    [],
  );
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    // console.log("editingVideoId", videos.findIndex(video => video.id_video === editingVideoId));
    let newFormGeneratorTemplate: FormGeneratorTemplateItem[] = [];
    videos.forEach((video, index) => {
      if (index === videos.findIndex((video) => video.id_video === editingVideoId)) {
        newFormGeneratorTemplate.push(
          {
            id: 0,
            title: 'Tilte',
            description: 'Change and edit you title',
            icon: 'cardtext',
            form: [
              {
                type: 'text',
                name: 'title',
                placeholder: 'Title',
                value: video.title_video,
                onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                  console.log(event.target.value);
                },
              },
            ],
          },
          {
            id: 1,
            title: 'Description',
            description: 'Change and edit you description',
            icon: 'bodytext',
            form: [
              {
                type: 'text',
                name: 'Description',
                placeholder: 'Description',
                value: video.description,
                onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                  console.log(event.target.value);
                },
              },
            ],
          },
        );
      }
    });
    setFormGeneratorTemplate(newFormGeneratorTemplate);
  }, [editingVideoId]);

  const fetchVideos = async () => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/videos`, {
        email,
      });
      setVideos(response.data.data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const updateVideoData = async (newTitle: string, newDescription: string, slug: string) => {
    // console.log('newTitle', newTitle)
    // console.log('newDescription', newDescription)
    // console.log('slug', slug)
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/upload/title`, {
        title: newTitle,
        description: newDescription,
        slug: slug,
      });
      console.log(response.data);
      if (response.data.status === 'success') {
        // alert('Video data updated successfully')
        fetchVideos();
        setShowToast(true);
        setTimeout(() => {
          setShowToast(false);
        }, 3000);
        const modalElement = document.getElementById('my_modal_3') as HTMLDialogElement;
        if (modalElement) {
          modalElement.close();
        }
      } else {
        alert('Failed to update video data');
      }
      // setVideoData(response.data);
    } catch (error) {
      console.error('Failed to update video data:', error);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [email]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Find the index of the form that contains the input field being updated
    const formIndex = formGeneratorTemplate.findIndex((form) =>
      form.form.some((field) => field.name === event.target.name),
    );
    if (formIndex !== -1) {
      // Find the index of the input field within the form
      const inputIndex = formGeneratorTemplate[formIndex].form.findIndex(
        (field) => field.name === event.target.name,
      );
      if (inputIndex !== -1) {
        // Update the value of the input field
        const updatedFormGeneratorTemplate = [...formGeneratorTemplate];
        updatedFormGeneratorTemplate[formIndex].form[inputIndex].value = event.target.value;
        setFormGeneratorTemplate(updatedFormGeneratorTemplate);
      }
    }
  };

  console.log(videos);
  return (
    <>
      {showToast && (
        <div className="toast toast-end toast-bottom absolute">
          <div className="alert alert-success">
            <span>Change Data Success</span>
          </div>
        </div>
      )}
      <dialog id="my_modal_3" className="modal">
        <div className="modal-box h-fit max-w-[100%]">
          <form method="dialog">
            {/* if there is a button in form, it will close the modal */}
            <button className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2">✕</button>
          </form>
          <div className="">
            <div>
              <p className="text-xl font-bold">Please Select one of option below</p>
              <p className="text-sm font-light">Follow the simple step to complete you edit</p>
              <div>
                <div className="mt-2 flex">
                  <div className="mr-4 flex flex-col gap-4">
                    {formGeneratorTemplate.map((data, index) => (
                      <div
                        key={index}
                        className="flex cursor-pointer justify-between"
                        onClick={() => {
                          setFormSelected(data.id);
                        }}
                      >
                        <div className="w-1/2">
                          <p className="text-xl font-bold">{data.title}</p>
                          <p className="text-sm font-light">{data.description}</p>
                        </div>
                        <div
                          className={`h-20 w-20 rounded-full p-3 ${
                            formGeneratorTemplate[FormSelected]?.id === data.id ? 'bg-blue-500' : ''
                          }`}
                        >
                          {/* <img className={`w-full h-full p-4`} src={data.img} alt="thumbnail" /> */}
                          {data.icon === 'bodytext' ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              fill="currentColor"
                              className="bi bi-body-text h-full w-full fill-white"
                              viewBox="0 0 16 16"
                            >
                              <path
                                fill-rule="evenodd"
                                d="M0 .5A.5.5 0 0 1 .5 0h4a.5.5 0 0 1 0 1h-4A.5.5 0 0 1 0 .5m0 2A.5.5 0 0 1 .5 2h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m9 0a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m-9 2A.5.5 0 0 1 .5 4h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5m5 0a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m7 0a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5m-12 2A.5.5 0 0 1 .5 6h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5m8 0a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m-8 2A.5.5 0 0 1 .5 8h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5m7 0a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5m-7 2a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 0 1h-8a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5m0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5"
                              />
                            </svg>
                          ) : data.icon === 'cardtext' ? (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              fill="currentColor"
                              className="bi bi-card-text h-full w-full fill-white"
                              viewBox="0 0 16 16"
                            >
                              <path d="M14.5 3a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-13a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5zm-13-1A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2z" />
                              <path d="M3 5.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5M3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8m0 2.5a.5.5 0 0 1 .5-.5h6a.5.5 0 0 1 0 1h-6a.5.5 0 0 1-.5-.5" />
                            </svg>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="h-full w-full">
                    {formGeneratorTemplate[FormSelected]?.form.map(
                      (form, index) => (
                        console.log(form),
                        (
                          <div key={index} className="flex h-full flex-col">
                            <div className="flex flex-col">
                              <label className="input input-bordered flex items-center gap-2">
                                {form.placeholder}
                                <input
                                  className="grow"
                                  type={form.type}
                                  name={form.name}
                                  placeholder={form.placeholder}
                                  value={form.value}
                                  onChange={handleInputChange}
                                />
                              </label>
                            </div>

                            <button
                              className="btn btn-outline btn-accent mt-4 w-20 self-end"
                              onClick={() => {
                                updateVideoData(
                                  formGeneratorTemplate[0].form[0].value,
                                  formGeneratorTemplate[1].form[0].value,
                                  videos[
                                    videos.findIndex((video) => video.id_video === editingVideoId)
                                  ].slug,
                                );
                              }}
                            >
                              Save
                            </button>
                          </div>
                        )
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </dialog>
      <div className="flex w-full justify-center">
        <div className="w-[80%] overflow-x-auto">
          <table className="table table-zebra table-pin-rows table-pin-cols table-lg w-full">
            {/* head */}
            <thead>
              <tr>
                <th>Video</th>
                <th>Title</th>
                <th>Path</th>
                <th>Option</th>
              </tr>
            </thead>
            <tbody className="">
              {videos.map((video, index) => (
                <tr key={index}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="mask mask-squircle h-12 w-12">
                          <img
                            src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/thumbnail/${video.slug}`}
                            alt="Avatar Tailwind CSS Component"
                          />
                        </div>
                      </div>
                      <p className="font-bold ">{video.title_video}</p>
                    </div>
                  </td>
                  <td>
                    {video.description}
                    {/* <br />
                    <span className="badge badge-ghost badge-sm">{video.description}</span> */}
                  </td>
                  <td>{video.slug}</td>
                  <th>
                    <button
                      className="btn btn-ghost btn-md"
                      onClick={() => {
                        setEditingVideoId(video.id_video);
                        const modalElement = document.getElementById(
                          'my_modal_3',
                        ) as HTMLDialogElement;
                        if (modalElement) {
                          modalElement.showModal();
                        }
                      }}
                    >
                      Edit
                    </button>
                  </th>
                </tr>
              ))}
            </tbody>
            {/* foot */}
            {/* <tfoot>
      <tr>
      <th></th>
      <th>Video</th>
      <th>Tittle</th>
      <th>Path</th>
      <th>Option</th>
      </tr>
    </tfoot> */}
          </table>
        </div>
      </div>
    </>
  );
}
