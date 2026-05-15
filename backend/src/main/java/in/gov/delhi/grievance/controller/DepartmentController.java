package in.gov.delhi.grievance.controller;

import in.gov.delhi.grievance.dto.ApiResponse;
import in.gov.delhi.grievance.model.Department;
import in.gov.delhi.grievance.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentRepository departmentRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Department>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(departmentRepository.findByIsActiveTrue()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Department>> getById(@PathVariable Long id) {
        return departmentRepository.findById(id)
                .map(d -> ResponseEntity.ok(ApiResponse.success(d)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Department>> create(@RequestBody Department dept) {
        return ResponseEntity.ok(ApiResponse.success(departmentRepository.save(dept)));
    }
}
