package com.ycyu.backend.service;

import com.ycyu.backend.dto.MedicineDTO;
import com.ycyu.backend.entity.Medicine;
import com.ycyu.backend.repository.MedicineRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MedicineService {

    @Autowired
    private MedicineRepository medicineRepository;

    public List<MedicineDTO> getAllMedicines() {
        return medicineRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<MedicineDTO> getActiveMedicines() {
        return medicineRepository.findByEnabledTrueOrderByHourAscMinuteAsc().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public MedicineDTO getMedicineById(Integer id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("药品不存在"));
        return convertToDTO(medicine);
    }

    public MedicineDTO createMedicine(MedicineDTO dto) {
        Medicine medicine = convertToEntity(dto);
        Medicine saved = medicineRepository.save(medicine);
        return convertToDTO(saved);
    }

    public MedicineDTO updateMedicine(Integer id, MedicineDTO dto) {
        Medicine existing = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("药品不存在"));

        // 手动复制属性
        existing.setName(dto.getName());
        existing.setDosage(dto.getDosage());
        existing.setHour(dto.getHour());
        existing.setMinute(dto.getMinute());
        existing.setBoxNum(dto.getBoxNum());
        existing.setEnabled(dto.getEnabled());

        Medicine updated = medicineRepository.save(existing);
        return convertToDTO(updated);
    }

    public void deleteMedicine(Integer id) {
        medicineRepository.deleteById(id);
    }

    public void toggleMedicineStatus(Integer id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("药品不存在"));
        medicine.setEnabled(!medicine.getEnabled());
        medicineRepository.save(medicine);
    }

    private MedicineDTO convertToDTO(Medicine medicine) {
        MedicineDTO dto = new MedicineDTO();
        dto.setId(medicine.getId());
        dto.setName(medicine.getName());
        dto.setDosage(medicine.getDosage());
        dto.setHour(medicine.getHour());
        dto.setMinute(medicine.getMinute());
        dto.setBoxNum(medicine.getBoxNum());
        dto.setEnabled(medicine.getEnabled());
        return dto;
    }

    private Medicine convertToEntity(MedicineDTO dto) {
        Medicine medicine = new Medicine();
        medicine.setName(dto.getName());
        medicine.setDosage(dto.getDosage());
        medicine.setHour(dto.getHour());
        medicine.setMinute(dto.getMinute());
        medicine.setBoxNum(dto.getBoxNum());
        medicine.setEnabled(dto.getEnabled());
        return medicine;
    }
}