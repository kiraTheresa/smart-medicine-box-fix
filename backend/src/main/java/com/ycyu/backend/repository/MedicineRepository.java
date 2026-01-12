package com.ycyu.backend.repository;

import com.ycyu.backend.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MedicineRepository extends JpaRepository<Medicine, Integer> {
    List<Medicine> findByEnabledTrueOrderByHourAscMinuteAsc();
    List<Medicine> findByBoxNum(Integer boxNum);
}