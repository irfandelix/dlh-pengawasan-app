import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Pplh from "@/models/Pplh";

// GET: Ambil semua petugas
export async function GET() {
  await dbConnect();
  const petugas = await Pplh.find().sort({ createdAt: -1 });
  return NextResponse.json(petugas);
}

// POST: Tambah petugas baru
export async function POST(req) {
  await dbConnect();
  const body = await req.json();
  const newPetugas = await Pplh.create(body);
  return NextResponse.json(newPetugas);
}

// DELETE: Hapus petugas
export async function DELETE(req) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  await Pplh.findByIdAndDelete(id);
  return NextResponse.json({ message: "Deleted" });
}

// PUT: Edit petugas (Opsional, jika mau fitur edit)
export async function PUT(req) {
  await dbConnect();
  const body = await req.json();
  const { _id, ...updateData } = body;
  const updated = await Pplh.findByIdAndUpdate(_id, updateData, { new: true });
  return NextResponse.json(updated);
}