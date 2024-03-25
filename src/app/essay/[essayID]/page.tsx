"use client";

import { useEffect, useRef, useState } from "react";
import { FiArrowLeft, FiDownload, FiSave, FiSettings } from "react-icons/fi";
import { useParams, useRouter } from "next/navigation";

import Editor from "~/components/EditorJS";
import LogoBar from "~/components/LogoBar";
import EssayPreamble from "~/components/Viewer/EssayPreamble";
import MetadataModal from "~/components/MetadataModal";
import { exportToJson } from "~/utils/files";
import useDataStore from "~/store/data";

import { Essay } from "~/types/essay";
import type { ConfigEssay } from "~/types/config";

import styles from "./styles.module.scss";

const MEDIA_PATH_PREFIX = "https://d12q9fe14kxf9b.cloudfront.net";

function getPosterPath(hvtID: string) {
  return `${MEDIA_PATH_PREFIX}/${hvtID}/poster.jpg`;
}

function getVideoPath(hvtID: string) {
  return `${MEDIA_PATH_PREFIX}/${hvtID}/background-loop-1280.mp4`;
}

export default function EssayPage() {
  const [data, setData] = useState<Essay>();
  const [metadataModalOpen, setMetadataModalOpen] = useState<boolean>(false);

  const { essays } = useDataStore();

  const videoRef = useRef<HTMLVideoElement>(null);

  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    let essay;
    if (!essays) {
      const localDataStore = JSON.parse(
        localStorage.getItem("data") ?? "",
      ).state;
      essay = (localDataStore.essays as Array<Essay>).find(
        (e) => e.meta.slug === params.essayID,
      );
    } else {
      essay = essays.find((e) => e.meta.slug === params.essayID);
    }
    if (essay) {
      setData(essay);
    } else {
      alert(`Essay ${params.essayID} not found, redirecting...`);
      return router.push("/");
    }
  }, [params.essayID]);

  useEffect(() => {
    if (data?.meta.hvtID) {
      videoRef.current?.load();
    }
  }, [data?.meta.hvtID]);

  if (!data) return;

  return (
    <>
      <MetadataModal
        meta={data.meta as ConfigEssay}
        show={metadataModalOpen}
        onCancel={() => setMetadataModalOpen(false)}
        onSave={(metadata) => {
          // TODO find old entry and edit
          setData((prev) => ({ ...prev!, meta: metadata }));
          setMetadataModalOpen(false);
        }}
      />
      <div className="serif-copy-ff relative flex h-screen flex-col overflow-hidden">
        <div className="z-[100] h-[60px] overflow-hidden shadow-[0_0_10px_rgba(0,0,0,.3)]">
          <LogoBar />
        </div>

        <div className="flex-shrink flex-grow-0 basis-full overflow-scroll">
          <header className="relative z-[40] box-border h-[50vh] overflow-hidden">
            <div className="absolute bottom-0 left-[calc(50%-400px)] right-[calc(50%-400px)] top-0 z-[100] bg-[linear-gradient(90deg,#000_10%,rgba(0,0,0,.1)49%,rgba(0,0,0,.1)51%,#000_90%)]" />
            <div className="absolute inset-0 z-0 flex flex-col items-center justify-center overflow-hidden bg-black">
              {data.meta.hvtID && (
                <video
                  className="h-full max-h-full w-full max-w-[800px] object-cover object-center"
                  playsInline
                  loop
                  autoPlay
                  disablePictureInPicture
                  ref={videoRef}
                  poster={getPosterPath(data.meta.hvtID)}
                >
                  <source src={getVideoPath(data.meta.hvtID)} />
                </video>
              )}
            </div>
            <div className="relative z-[200] flex h-full flex-col justify-end bg-[rgba(0,0,0,.3)] px-[30px] pb-[30px] text-white">
              <p className="sans-title-ff my-[1em] text-[13px] uppercase tracking-[.5px] [text-shadow:_0_0_9px_#000]">
                introduction to the testimony of
              </p>

              {/* TODO:
               * Text area is vertically scrollable, can we remove that?
               * Has no line wrap on overflow. Add so that it behaves like the critical-edition-viewer
               */}
              <input
                type="textarea"
                name="Title"
                placeholder="Title"
                className="mb-[0.75em] h-[56px] w-full rounded bg-transparent p-0 text-[56px] [text-shadow:_0_0_9px_#000] focus:border-white focus:ring-0"
                value={data.meta.title ?? ""}
                onChange={(e) => {
                  setData((prev) => ({
                    ...prev!,
                    meta: { ...prev!.meta, title: e.target.value },
                  }));
                }}
              />
              <div className="flex items-center text-[24px] [text-shadow:_0_0_9px_#000]">
                by&nbsp;
                <input
                  type="textarea"
                  name="Author"
                  placeholder="Author"
                  className="h-[31px] flex-1 rounded bg-transparent p-0 text-[24px] [text-shadow:_0_0_9px_#000] focus:border-white focus:ring-0"
                  value={data.meta.author ?? ""}
                  onChange={(e) => {
                    setData((prev) => ({
                      ...prev!,
                      meta: { ...prev!.meta, author: e.target.value },
                    }));
                  }}
                />
              </div>
              <div className="font-helvetica text-[13px]">
                <input
                  type="textarea"
                  name="Affiliation"
                  placeholder="Affiliation"
                  className="h-[13px] w-full rounded bg-transparent p-0 text-[13px] [text-shadow:_0_0_9px_#000] focus:border-white focus:ring-0"
                  value={data.meta.affiliation ?? ""}
                  onChange={(e) => {
                    setData((prev) => ({
                      ...prev!,
                      meta: { ...prev!.meta, affiliation: e.target.value },
                    }));
                  }}
                />
              </div>
            </div>
            <div className="h-80 bg-white" />
          </header>

          <EssayPreamble hvtID={data.meta.hvtID} />

          <div
            // style={{ top: Math.max(0, 200 - this.state.scrollPosition) }}
            className={styles.ContentBodyContainer}
          >
            <main className={styles.ContentBodyContents}>
              <Editor
                data={data.blocks}
                onDataChange={(data) =>
                  setData((prev) => ({ ...prev!, blocks: data }))
                }
              />
            </main>

            <div className="pointer-events-none fixed bottom-5 left-5 right-5 z-10">
              <div className="flex justify-center">
                <div className="flex w-full max-w-7xl justify-between">
                  <div className="flex items-center divide-x divide-white overflow-hidden rounded">
                    <button
                      className="pointer-events-auto flex items-center gap-3 bg-critical-600 p-3 font-[Helvetica,Arial,sans-serif] text-white transition-colors hover:bg-critical-700"
                      type="button"
                      onPointerDown={(e) => {
                        if (
                          window.confirm("Are you sure you want to go back?")
                        ) {
                          router.push("/");
                        }
                      }}
                    >
                      <FiArrowLeft />
                      Back
                    </button>

                    <button
                      data-modal-target="metadata-modal"
                      data-modal-toggle="metadata-modal"
                      className=" pointer-events-auto flex items-center gap-3 bg-critical-600 p-3 font-[Helvetica,Arial,sans-serif] text-white transition-colors hover:bg-critical-700"
                      // onClick={() => setMetadataModalOpen(true)}
                      type="button"
                    >
                      <FiSave /> Save
                    </button>
                  </div>

                  <div className="flex items-center divide-x divide-white overflow-hidden rounded">
                    <button
                      data-modal-target="metadata-modal"
                      data-modal-toggle="metadata-modal"
                      className=" pointer-events-auto flex items-center gap-3 bg-critical-600 p-3 font-[Helvetica,Arial,sans-serif] text-white transition-colors hover:bg-critical-700"
                      onClick={() => setMetadataModalOpen(true)}
                      type="button"
                    >
                      <FiSettings /> Setttings
                    </button>

                    <button
                      className="flex items-center gap-3 bg-critical-600 p-3 font-[Helvetica,Arial,sans-serif] text-white transition-colors hover:bg-critical-700"
                      type="button"
                      onPointerDown={
                        (e) => exportToJson(e, data.blocks, data.meta.slug)
                        // fetch("api/save?path=test", { method: "GET" })
                      }
                    >
                      <FiDownload />
                      JSON
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
