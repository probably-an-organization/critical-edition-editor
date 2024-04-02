"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FiDownload, FiPlus } from "react-icons/fi";
import JSZip from "jszip";

import LogoBar from "~/components/LogoBar";
import ImpactHeader from "~/components/ImpactHeader";
import EssayIndexItem from "~/components/EssayIndexItem";
import Import from "~/components/Import";
import useLocalDataStore from "~/store/local-data";
import useGitDataStore from "~/store/git";
import { fetchGitHubData } from "~/utils/data";

import type { DataStore } from "~/types/store";
import type { ConfigEssay } from "~/types/config";

import styles from "./styles.module.scss";

export default function HomePage() {
  const localDataStore: DataStore = useLocalDataStore();
  const gitDataStore: DataStore = useGitDataStore();

  useEffect(() => {
    if (gitDataStore.config) {
      return;
    }

    const fetch = async () => {
      const newGitData = await fetchGitHubData();
      gitDataStore.setConfig(newGitData.config);
      gitDataStore.setEssays(newGitData.essays);
    };

    const gitData = JSON.parse(localStorage.getItem("git-data") ?? "").state;
    if (gitData.config && gitData.essays) {
      gitDataStore.setConfig(gitData.config);
      gitDataStore.setEssays(gitData.essays);
    } else {
      fetch();
    }
  }, [gitDataStore.config]);

  useEffect(() => {
    if (localDataStore.config) {
      return;
    }
    const localData = JSON.parse(
      localStorage.getItem("local-data") ?? "",
    ).state;
    localDataStore.setConfig(localData.config ?? gitDataStore.config);
    localDataStore.setEssays(localData.essays ?? gitDataStore.essays);
  }, [localDataStore.config, gitDataStore.config]);

  if (localDataStore.config === null) {
    return;
  }

  const moveEssay = (id: string, direction: "up" | "down") => {
    const newEssays = [...localDataStore.config.essays];
    const newEssayOrder = [...localDataStore.config.projectData.essayOrder];
    // essays
    const essaysAIndex = newEssays.findIndex((e) => e.id === id);
    if (essaysAIndex < 0) return;
    const essaysBIndex = essaysAIndex - (direction === "up" ? 1 : -1);
    if (essaysBIndex < 0 || essaysBIndex > newEssays.length - 1) return;
    const tempEssay = newEssays[essaysBIndex];
    newEssays[essaysBIndex] = newEssays[essaysAIndex]!;
    newEssays[essaysAIndex] = tempEssay!;
    // essay order
    const essayOrderAIndex = newEssayOrder.findIndex((e) => e === id);
    if (essayOrderAIndex < 0) return;
    const essayOrderBIndex = essayOrderAIndex - (direction === "up" ? 1 : -1);
    if (essayOrderBIndex < 0 || essayOrderBIndex > newEssayOrder.length - 1)
      return;
    const tempEssayOder = newEssayOrder[essayOrderBIndex];
    newEssayOrder[essayOrderBIndex] = newEssayOrder[essayOrderAIndex]!;
    newEssayOrder[essayOrderAIndex] = tempEssayOder!;
    // update
    localDataStore.setConfig({
      essays: newEssays,
      projectData: {
        ...localDataStore.config.projectData,
        essayOrder: newEssayOrder,
      },
    });
  };

  const deleteEssay = (id: string) => {
    // essays
    const newEssays = localDataStore.config.essays.reduce(
      (acc: Array<ConfigEssay>, curr: ConfigEssay) => {
        if (curr.id !== id) {
          acc.push(curr);
        }
        return acc;
      },
      [],
    );
    // essay order
    const newEssayOrder = localDataStore.config.projectData.essayOrder.reduce(
      (acc: Array<string>, curr: string) => {
        if (curr !== id) {
          acc.push(curr);
        }
        return acc;
      },
      [],
    );
    // update
    localDataStore.setConfig({
      essays: newEssays,
      projectData: {
        ...localDataStore.config.projectData,
        essayOrder: newEssayOrder,
      },
    });
  };

  const downloadZip = async () => {
    const files: Array<{ path: string; blob: Blob }> = [];
    files.push({
      path: "config.json",
      blob: new Blob([JSON.stringify(localDataStore.config)]),
    });
    if (!localDataStore.essays) return;
    for (const essay of localDataStore.essays) {
      files.push({
        path: `intro-${essay.meta.slug}.json`,
        blob: new Blob([JSON.stringify(essay)]),
      });
    }
    const zip = new JSZip();
    for (const file of files) {
      zip.folder("data")!.file(file.path, file.blob);
    }

    const zipData = await zip.generateAsync({
      type: "blob",
      streamFiles: true,
    });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(zipData);
    link.download = "critical-edition-data.zip";
    link.click();
    link.remove();
  };

  return (
    <div className="serif-copy-ff">
      <LogoBar />
      <ImpactHeader
        caption="Photo: Steven H. and Marion L. Holocaust testimony (HVT-544), recorded in 1985."
        backgroundImageURL="/img/impact-header-background.jpg"
        title="Critical Editions Editor"
        subtitle="Create and change testimonies"
      />
      <main className={styles.CenterColumn}>
        <div className={styles.IndexHeader}>
          <p className="sans-copy-ff">
            {localDataStore.config.projectData.introCopy}
          </p>
        </div>
        <nav aria-label="List of essays">
          <ul className={styles.ItemListContainer}>
            <li className="h-[300px] max-w-[500px] flex-shrink-0 flex-grow basis-1/2 lg:h-auto">
              <Link
                className="group block h-full w-full rounded p-2.5 transition-colors hover:bg-gray-200"
                href="/new"
              >
                <div className="flex h-full w-full items-center justify-center gap-3 border-2 border-neutral-800 bg-neutral-100 transition-colors group-hover:border-critical-600 group-hover:bg-critical-600 group-hover:text-white">
                  <FiPlus size={30} strokeWidth={1.5} />
                  <span className="scale-100 text-3xl">Create new</span>
                </div>
              </Link>
            </li>
            {localDataStore.config.essays.map((essay: any) => (
              <li key={essay.id} className={styles.IndexItemContainer}>
                <EssayIndexItem
                  showSupertitles={
                    localDataStore.config.projectData.showSupertitlesOnIndexPage
                  }
                  showBylines={
                    localDataStore.config.projectData.showBylinesOnIndexPage
                  }
                  textOnly={localDataStore.config.projectData.textOnlyIndexPage}
                  essay={essay}
                  onChangeOrder={(direction: "up" | "down") =>
                    moveEssay(essay.id, direction)
                  }
                  onDelete={() => {
                    if (
                      window.confirm(
                        `Are you sure you want to delete Essay \"${essay.title}\"?`,
                      )
                    ) {
                      deleteEssay(essay.id);
                    }
                  }}
                />
              </li>
            ))}
          </ul>
        </nav>
      </main>

      <div className="pointer-events-none fixed bottom-5 left-5 right-5 z-10">
        <div className="flex justify-center">
          <div className="flex w-full max-w-7xl justify-between">
            {/* left side */}
            <div className="flex items-center divide-x divide-white overflow-hidden rounded"></div>
            {/* right side */}
            <div className="flex items-center divide-x divide-white overflow-hidden rounded">
              <Import />

              <button
                className="pointer-events-auto flex items-center gap-3 bg-critical-600 p-3 font-[Helvetica,Arial,sans-serif] text-white transition-colors hover:bg-critical-700"
                type="button"
                onPointerDown={downloadZip}
              >
                <FiDownload />
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
