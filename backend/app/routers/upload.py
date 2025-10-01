from fastapi import APIRouter, UploadFile, File

router = APIRouter()


@router.post("/")
async def upload_receipt(file: UploadFile = File(...)):
    # For now, just return the file name
    return {"filename": file.filename}
