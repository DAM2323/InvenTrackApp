package com.inventrack.inventrack.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.inventrack.inventrack.entity.Inventario;

public interface InventarioRepository extends JpaRepository<Inventario, Integer> {

    Optional<Inventario> findBySucursal_IdAndProducto_Id(
        Integer idSucursal,
        Integer idProducto
    );

    List<Inventario> findBySucursal_Id(Integer idSucursal);

    @Query("""
        select i
        from Inventario i
        where i.sucursal.id = :idSucursal
        and i.cantidadDisponible <= i.producto.stockMinimo
    """)
    List<Inventario> stockBajo(
        @Param("idSucursal") Integer idSucursal
    );
}
