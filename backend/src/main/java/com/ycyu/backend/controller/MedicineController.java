package com.ycyu.backend.controller;

import com.ycyu.backend.dto.MedicineDTO;
import com.ycyu.backend.service.MedicineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/medicines")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
public class MedicineController {

    @Autowired
    private MedicineService medicineService;

    @GetMapping
    public ResponseEntity<List<MedicineDTO>> getAllMedicines() {
        return ResponseEntity.ok(medicineService.getAllMedicines());
    }

    @GetMapping("/active")
    public ResponseEntity<List<MedicineDTO>> getActiveMedicines() {
        return ResponseEntity.ok(medicineService.getActiveMedicines());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MedicineDTO> getMedicineById(@PathVariable Integer id) {
        return ResponseEntity.ok(medicineService.getMedicineById(id));
    }

    @PostMapping
    public ResponseEntity<?> createMedicine(@Valid @RequestBody MedicineDTO medicineDTO,
                                            BindingResult result) {
        if (result.hasErrors()) {
            return ResponseEntity.badRequest().body(result.getAllErrors());
        }
        return new ResponseEntity<>(
                medicineService.createMedicine(medicineDTO),
                HttpStatus.CREATED
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateMedicine(@PathVariable Integer id,
                                            @Valid @RequestBody MedicineDTO medicineDTO,
                                            BindingResult result) {
        if (result.hasErrors()) {
            return ResponseEntity.badRequest().body(result.getAllErrors());
        }
        return ResponseEntity.ok(medicineService.updateMedicine(id, medicineDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedicine(@PathVariable Integer id) {
        medicineService.deleteMedicine(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Void> toggleMedicineStatus(@PathVariable Integer id) {
        medicineService.toggleMedicineStatus(id);
        return ResponseEntity.ok().build();
    }
}