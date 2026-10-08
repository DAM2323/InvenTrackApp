package com.inventrack.inventrack.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.inventrack.inventrack.entity.DetalleCompra;

public interface DetalleCompraRepository extends JpaRepository<DetalleCompra, Integer> {

    List<DetalleCompra> findByOrdenCompra_Id(Integer idCompra);
}
