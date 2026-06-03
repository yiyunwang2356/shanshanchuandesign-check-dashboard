"use client";

import {
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Cloud,
  Download,
  FileText,
  Home,
  ImagePlus,
  Loader2,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UploadCloud,
  UserRound
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { isFirebaseConfigured } from "@/lib/firebase";
import type { DefectStatus, InspectionDefect, InspectionPhoto, InspectionProject } from "@/lib/types";

const today = new Date().toISOString().slice(0, 10);

const starterProjects: InspectionProject[] = [
  {
    id: "project-demo",
    name: "青山寓所完工驗收",
    inspectionDate: today,
    ownerName: "王小姐",
    siteAddress: "台北市大安區",
    note: "主臥、廚房與玄關五金需現場複查。",
    createdAt: new Date().toISOString(),
    defects: [
      {
        id: "defect-1",
        location: "主臥衣櫃",
        content: "右側門片閉合時有摩擦聲，需調整鉸鏈。",
        status: "待改善",
        dueDate: today,
        note: "請木作師傅複查門縫與緩衝五金。",
        photos: []
      },
      {
        id: "defect-2",
        location: "廚房檯面",
        content: "水槽左側矽利康收邊不均。",
        status: "已完成",
        dueDate: today,
        note: "已通知清潔後補拍完成照片。",
        photos: []
      }
    ]
  }
];

function makeId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function compressImage(file: File, maxWidth = 1400, quality = 0.74): Promise<InspectionPhoto> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Cannot compress image"));
          return;
        }

        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const url = canvas.toDataURL("image/jpeg", quality);
        resolve({
          id: makeId("photo"),
          name: file.name,
          url,
          size: Math.round((url.length * 3) / 4),
          uploadedAt: new Date().toISOString()
        });
      };
      image.onerror = reject;
      image.src = String(reader.result);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function HomePage() {
  const [projects, setProjects] = useState<InspectionProject[]>(starterProjects);
  const [activeProjectId, setActiveProjectId] = useState(starterProjects[0].id);
  const [query, setQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [projectForm, setProjectForm] = useState({
    name: "",
    inspectionDate: today,
    ownerName: "",
    siteAddress: "",
    note: ""
  });
  const [defectForm, setDefectForm] = useState({
    location: "",
    content: "",
    status: "待改善" as DefectStatus,
    dueDate: today,
    note: ""
  });

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const text = `${project.name} ${project.ownerName} ${project.siteAddress}`.toLowerCase();
      return text.includes(query.trim().toLowerCase());
    });
  }, [projects, query]);

  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0];

  const stats = useMemo(() => {
    const allDefects = projects.flatMap((project) => project.defects);
    const pending = allDefects.filter((defect) => defect.status === "待改善").length;
    const done = allDefects.filter((defect) => defect.status === "已完成").length;
    const photos = allDefects.reduce((sum, defect) => sum + defect.photos.length, 0);
    return { pending, done, photos, total: allDefects.length };
  }, [projects]);

  function updateProject(projectId: string, updater: (project: InspectionProject) => InspectionProject) {
    setProjects((current) => current.map((project) => (project.id === projectId ? updater(project) : project)));
  }

  function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectForm.name.trim() || !projectForm.ownerName.trim()) return;

    const nextProject: InspectionProject = {
      id: makeId("project"),
      name: projectForm.name.trim(),
      inspectionDate: projectForm.inspectionDate,
      ownerName: projectForm.ownerName.trim(),
      siteAddress: projectForm.siteAddress.trim(),
      note: projectForm.note.trim(),
      createdAt: new Date().toISOString(),
      defects: []
    };

    setProjects((current) => [nextProject, ...current]);
    setActiveProjectId(nextProject.id);
    setProjectForm({ name: "", inspectionDate: today, ownerName: "", siteAddress: "", note: "" });
  }

  function handleCreateDefect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeProject || !defectForm.content.trim()) return;

    const nextDefect: InspectionDefect = {
      id: makeId("defect"),
      location: defectForm.location.trim(),
      content: defectForm.content.trim(),
      status: defectForm.status,
      dueDate: defectForm.dueDate,
      note: defectForm.note.trim(),
      photos: []
    };

    updateProject(activeProject.id, (project) => ({
      ...project,
      defects: [nextDefect, ...project.defects]
    }));
    setDefectForm({ location: "", content: "", status: "待改善", dueDate: today, note: "" });
  }

  function updateDefect(defectId: string, patch: Partial<InspectionDefect>) {
    if (!activeProject) return;
    updateProject(activeProject.id, (project) => ({
      ...project,
      defects: project.defects.map((defect) => (defect.id === defectId ? { ...defect, ...patch } : defect))
    }));
  }

  function deleteDefect(defectId: string) {
    if (!activeProject) return;
    updateProject(activeProject.id, (project) => ({
      ...project,
      defects: project.defects.filter((defect) => defect.id !== defectId)
    }));
  }

  async function handlePhotoUpload(defectId: string, files: FileList | null) {
    if (!activeProject || !files?.length) return;
    const photos = await Promise.all(Array.from(files).map((file) => compressImage(file)));
    updateProject(activeProject.id, (project) => ({
      ...project,
      defects: project.defects.map((defect) =>
        defect.id === defectId ? { ...defect, photos: [...photos, ...defect.photos] } : defect
      )
    }));
  }

  function exportPdf() {
    if (!activeProject) return;
    setIsExporting(true);

    const printWindow = window.open("", "_blank", "width=960,height=720");

    if (!printWindow) {
      setIsExporting(false);
      return;
    }

    const rows = activeProject.defects
      .map((defect, index) => {
        const photos = defect.photos
          .map((photo) => `<img src="${photo.url}" alt="${escapeHtml(photo.name)}" />`)
          .join("");

        return `
          <section class="defect">
            <div class="defect-head">
              <strong>${index + 1}. ${escapeHtml(defect.location || "未填位置")}</strong>
              <span>${escapeHtml(defect.status)}</span>
            </div>
            <p>${escapeHtml(defect.content)}</p>
            <small>改善期限：${escapeHtml(defect.dueDate || "未設定")}　備註：${escapeHtml(defect.note || "無")}</small>
            <div class="photos">${photos}</div>
          </section>
        `;
      })
      .join("");

    printWindow.document.write(`
      <!doctype html>
      <html lang="zh-TW">
        <head>
          <meta charset="utf-8" />
          <title>${escapeHtml(activeProject.name)} 驗收報告</title>
          <style>
            body { margin: 40px; color: #17201d; font-family: -apple-system, BlinkMacSystemFont, "Noto Sans TC", sans-serif; }
            header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #0b4b45; padding-bottom: 18px; margin-bottom: 24px; }
            h1 { margin: 0 0 10px; font-size: 26px; }
            .logo { width: 72px; height: 72px; display: grid; place-items: center; color: white; background: #0b4b45; border-radius: 8px; font-weight: 700; }
            dl { display: grid; grid-template-columns: 96px 1fr; gap: 8px 16px; margin: 0 0 24px; }
            dt { color: #62706b; }
            dd { margin: 0; font-weight: 700; }
            .defect { break-inside: avoid; padding: 16px 0; border-top: 1px solid #dce2dd; }
            .defect-head { display: flex; justify-content: space-between; gap: 16px; }
            .defect-head span { color: #0b4b45; font-weight: 700; }
            p { line-height: 1.7; }
            small { color: #62706b; }
            .photos { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
            img { width: 170px; height: 120px; object-fit: cover; border: 1px solid #dce2dd; border-radius: 6px; }
            @page { size: A4; margin: 18mm; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <header>
            <div>
              <h1>山川設計驗收報告</h1>
              <div>${escapeHtml(activeProject.name)}</div>
            </div>
            <div class="logo">SC</div>
          </header>
          <dl>
            <dt>業主名稱</dt><dd>${escapeHtml(activeProject.ownerName)}</dd>
            <dt>驗收日期</dt><dd>${escapeHtml(activeProject.inspectionDate)}</dd>
            <dt>工地地址</dt><dd>${escapeHtml(activeProject.siteAddress || "未填寫")}</dd>
            <dt>專案備註</dt><dd>${escapeHtml(activeProject.note || "無")}</dd>
          </dl>
          ${rows || "<p>目前尚無缺失紀錄。</p>"}
          <script>
            window.onload = () => {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    setIsExporting(false);
  }

  if (!activeProject) {
    return null;
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <ClipboardCheck size={22} />
          </div>
          <div>
            <strong>山川設計</strong>
            <span>驗收管理系統</span>
          </div>
        </div>

        <label className="search-box">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜尋專案或業主" />
        </label>

        <div className="project-list">
          {filteredProjects.map((project) => (
            <button
              className={`project-item ${project.id === activeProject.id ? "active" : ""}`}
              key={project.id}
              onClick={() => setActiveProjectId(project.id)}
            >
              <span>{project.name}</span>
              <small>{project.ownerName} · {project.inspectionDate}</small>
            </button>
          ))}
        </div>

        <div className="ownership-note">
          <ShieldCheck size={17} />
          <span>Firebase、資料庫、Storage 與 Hosting 帳號歸客戶所有。</span>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">MVP v1.0 · 內部驗收工作台</p>
            <h1>{activeProject.name}</h1>
          </div>
          <button className="primary-button" onClick={exportPdf} disabled={isExporting}>
            {isExporting ? <Loader2 className="spin" size={17} /> : <Download size={17} />}
            匯出 PDF
          </button>
        </header>

        <div className="status-grid">
          <div className="metric">
            <FileText size={18} />
            <span>專案數</span>
            <strong>{projects.length}</strong>
          </div>
          <div className="metric warning">
            <CalendarDays size={18} />
            <span>待改善</span>
            <strong>{stats.pending}</strong>
          </div>
          <div className="metric success">
            <CheckCircle2 size={18} />
            <span>已完成</span>
            <strong>{stats.done}</strong>
          </div>
          <div className="metric cloud">
            <Camera size={18} />
            <span>照片</span>
            <strong>{stats.photos}</strong>
          </div>
        </div>

        <div className="content-grid">
          <section className="panel project-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Project</p>
                <h2>建立驗收專案</h2>
              </div>
              <Plus size={19} />
            </div>
            <form className="form-grid" onSubmit={handleCreateProject}>
              <label>
                專案名稱
                <input value={projectForm.name} onChange={(event) => setProjectForm({ ...projectForm, name: event.target.value })} placeholder="例如：信義寓所完工驗收" required />
              </label>
              <label>
                驗收日期
                <input type="date" value={projectForm.inspectionDate} onChange={(event) => setProjectForm({ ...projectForm, inspectionDate: event.target.value })} />
              </label>
              <label>
                業主名稱
                <input value={projectForm.ownerName} onChange={(event) => setProjectForm({ ...projectForm, ownerName: event.target.value })} placeholder="業主或公司名稱" required />
              </label>
              <label>
                工地地址
                <input value={projectForm.siteAddress} onChange={(event) => setProjectForm({ ...projectForm, siteAddress: event.target.value })} placeholder="可留空" />
              </label>
              <label className="full">
                備註
                <textarea value={projectForm.note} onChange={(event) => setProjectForm({ ...projectForm, note: event.target.value })} placeholder="驗收範圍、現場注意事項" />
              </label>
              <button className="secondary-button" type="submit">
                <Plus size={16} />
                新增專案
              </button>
            </form>
          </section>

          <section className="panel summary-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Current</p>
                <h2>目前專案</h2>
              </div>
              <Home size={19} />
            </div>
            <dl className="detail-list">
              <div><dt>業主</dt><dd>{activeProject.ownerName}</dd></div>
              <div><dt>日期</dt><dd>{activeProject.inspectionDate}</dd></div>
              <div><dt>地址</dt><dd>{activeProject.siteAddress || "未填寫"}</dd></div>
              <div><dt>備註</dt><dd>{activeProject.note || "未填寫"}</dd></div>
            </dl>
            <div className={`firebase-status ${isFirebaseConfigured ? "ready" : ""}`}>
              <Cloud size={17} />
              {isFirebaseConfigured ? "Firebase 已設定，可接續雲端同步" : "尚未填 Firebase key，目前使用前端暫存資料"}
            </div>
          </section>
        </div>

        <section className="panel defects-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Inspection</p>
              <h2>缺失紀錄</h2>
            </div>
            <span className="count-pill">{activeProject.defects.length} 項</span>
          </div>

          <form className="defect-form" onSubmit={handleCreateDefect}>
            <label>
              位置
              <input value={defectForm.location} onChange={(event) => setDefectForm({ ...defectForm, location: event.target.value })} placeholder="例如：玄關、主臥、廚房" />
            </label>
            <label className="wide">
              缺失內容
              <input value={defectForm.content} onChange={(event) => setDefectForm({ ...defectForm, content: event.target.value })} placeholder="輸入現場待改善項目" required />
            </label>
            <label>
              狀態
              <select value={defectForm.status} onChange={(event) => setDefectForm({ ...defectForm, status: event.target.value as DefectStatus })}>
                <option>待改善</option>
                <option>已完成</option>
              </select>
            </label>
            <label>
              改善期限
              <input type="date" value={defectForm.dueDate} onChange={(event) => setDefectForm({ ...defectForm, dueDate: event.target.value })} />
            </label>
            <label className="wide">
              備註
              <input value={defectForm.note} onChange={(event) => setDefectForm({ ...defectForm, note: event.target.value })} placeholder="負責工班、複查說明" />
            </label>
            <button className="primary-button" type="submit">
              <Plus size={16} />
              新增缺失
            </button>
          </form>

          <div className="defect-table">
            {activeProject.defects.map((defect) => (
              <article className="defect-row" key={defect.id}>
                <div className="defect-main">
                  <div className="defect-titleline">
                    <strong>{defect.location || "未填位置"}</strong>
                    <button
                      className={`status-toggle ${defect.status === "已完成" ? "done" : ""}`}
                      onClick={() => updateDefect(defect.id, { status: defect.status === "待改善" ? "已完成" : "待改善" })}
                    >
                      {defect.status}
                    </button>
                  </div>
                  <p>{defect.content}</p>
                  <small>改善期限：{defect.dueDate || "未設定"} · {defect.note || "無備註"}</small>
                </div>

                <div className="photo-strip">
                  {defect.photos.map((photo) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={photo.id} src={photo.url} alt={photo.name} />
                  ))}
                  <label className="upload-tile">
                    <ImagePlus size={18} />
                    <span>上傳</span>
                    <input accept="image/*" capture="environment" type="file" multiple onChange={(event) => handlePhotoUpload(defect.id, event.target.files)} />
                  </label>
                </div>

                <button className="icon-button" aria-label="刪除缺失" onClick={() => deleteDefect(defect.id)}>
                  <Trash2 size={17} />
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="scope-band">
          <div>
            <UploadCloud size={19} />
            <strong>MVP 包含</strong>
            <span>基本驗收流程、響應式 Web App、Firebase 串接、照片上傳、PDF 匯出。</span>
          </div>
          <div>
            <UserRound size={19} />
            <strong>暫不包含</strong>
            <span>電子簽名、多角色權限、App 上架、LINE / Notion 串接、長期維護。</span>
          </div>
        </section>
      </section>
    </main>
  );
}
