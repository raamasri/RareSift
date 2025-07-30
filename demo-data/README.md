# Demo Data for RareSift

This directory contains sample data for demonstrating RareSift's capabilities.

## Sample Videos for YC Demo

For your YC demo, you'll need sample AV videos. Here are recommended sources:

### 1. Public AV Datasets
- **nuScenes**: https://www.nuscenes.org/
- **KITTI**: http://www.cvlibs.net/datasets/kitti/
- **Cityscapes**: https://www.cityscapes-dataset.com/
- **BDD100K**: https://bdd-data.berkeley.edu/

### 2. Demo Video Requirements
- **Format**: MP4, MOV, AVI (recommended: MP4)
- **Duration**: 2-5 minutes for quick demo
- **Content**: Should include:
  - Pedestrians crossing
  - Vehicle interactions
  - Different lighting conditions
  - Urban driving scenarios

### 3. Quick Demo Script

1. **Upload Phase** (30 seconds)
   - Upload a 3-minute urban driving video
   - Add metadata: "Urban driving, sunny, downtown SF"
   - Show processing status

2. **Search Phase** (45 seconds)
   - Text search: "pedestrian crossing street"
   - Show results with similarity scores
   - Try image search with uploaded example

3. **Export Phase** (30 seconds)
   - Select 3-5 best results
   - Export as training dataset
   - Download ZIP file

### 4. Sample Queries for Demo
- "pedestrian near intersection"
- "car turning left"
- "traffic light at night"
- "bicycle in bike lane"
- "emergency vehicle"
- "highway merge"

## Using Your Own Videos

1. Place video files in this directory
2. Use the upload interface at http://localhost:3000
3. Wait for processing to complete
4. Start searching!

## Demo Tips

- **Keep videos short** (2-5 min) for fast processing
- **Use clear scenarios** with obvious objects/actions
- **Practice the search flow** before the actual demo
- **Have backup queries** ready in case of issues
- **Test export functionality** beforehand

---

*Ready to demo AV scenario search that works in seconds, not hours!* 