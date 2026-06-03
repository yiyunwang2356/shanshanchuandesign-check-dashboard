export type DefectStatus = "待改善" | "已完成";

export type InspectionPhoto = {
  id: string;
  name: string;
  url: string;
  size: number;
  uploadedAt: string;
};

export type InspectionDefect = {
  id: string;
  location: string;
  content: string;
  status: DefectStatus;
  dueDate: string;
  note: string;
  photos: InspectionPhoto[];
};

export type InspectionProject = {
  id: string;
  name: string;
  inspectionDate: string;
  ownerName: string;
  siteAddress: string;
  note: string;
  createdAt: string;
  defects: InspectionDefect[];
};
